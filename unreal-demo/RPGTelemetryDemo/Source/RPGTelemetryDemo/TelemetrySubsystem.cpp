#include "TelemetrySubsystem.h"

#include "Dom/JsonObject.h"
#include "HttpModule.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"

DEFINE_LOG_CATEGORY_STATIC(LogTelemetry, Log, All);

void UTelemetrySubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    UE_LOG(
        LogTelemetry,
        Log,
        TEXT("Telemetry subsystem initialized.")
    );

    CheckBackendHealth();
}

void UTelemetrySubsystem::Deinitialize()
{
    UE_LOG(
        LogTelemetry,
        Log,
        TEXT("Telemetry subsystem deinitialized. Session ID: %d"),
        CurrentSessionId
    );

    CurrentSessionId = INDEX_NONE;
    bSessionRequestInFlight = false;

    Super::Deinitialize();
}

void UTelemetrySubsystem::CheckBackendHealth()
{
    const FString HealthUrl = BackendBaseUrl + TEXT("/health");

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request =
        FHttpModule::Get().CreateRequest();

    Request->SetURL(HealthUrl);
    Request->SetVerb(TEXT("GET"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    Request->SetTimeout(5.0f);

    Request->OnProcessRequestComplete().BindUObject(
        this,
        &UTelemetrySubsystem::HandleHealthResponse
    );

    UE_LOG(
        LogTelemetry,
        Log,
        TEXT("Sending backend health request to %s"),
        *HealthUrl
    );

    if (!Request->ProcessRequest())
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Failed to start backend health request.")
        );
    }
}

void UTelemetrySubsystem::HandleHealthResponse(
    FHttpRequestPtr /*Request*/,
    FHttpResponsePtr Response,
    bool bWasSuccessful
)
{
    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Backend health request failed. No valid HTTP response received.")
        );

        return;
    }

    const int32 StatusCode = Response->GetResponseCode();
    const FString ResponseBody = Response->GetContentAsString();

    if (StatusCode >= 200 && StatusCode < 300)
    {
        UE_LOG(
            LogTelemetry,
            Display,
            TEXT("Backend health check succeeded. HTTP %d. Response: %s"),
            StatusCode,
            *ResponseBody
        );

        StartPlaytestSession();

        return;
    }

    UE_LOG(
        LogTelemetry,
        Error,
        TEXT("Backend health check returned HTTP %d. Response: %s"),
        StatusCode,
        *ResponseBody
    );
}

void UTelemetrySubsystem::StartPlaytestSession()
{
    if (CurrentSessionId != INDEX_NONE)
    {
        UE_LOG(
            LogTelemetry,
            Warning,
            TEXT("A playtest session already exists. Session ID: %d"),
            CurrentSessionId
        );

        return;
    }

    if (bSessionRequestInFlight)
    {
        UE_LOG(
            LogTelemetry,
            Warning,
            TEXT("A playtest session request is already in progress.")
        );

        return;
    }

    const FString SessionsUrl = BackendBaseUrl + TEXT("/sessions");

    TSharedRef<FJsonObject> RequestJson = MakeShared<FJsonObject>();

    RequestJson->SetStringField(
        TEXT("player_name"),
        TEXT("UE5Player")
    );

    RequestJson->SetStringField(
        TEXT("build_version"),
        TEXT("ue5-demo-0.1.0")
    );

    FString RequestBody;

    TSharedRef<TJsonWriter<>> Writer =
        TJsonWriterFactory<>::Create(&RequestBody);

    if (!FJsonSerializer::Serialize(RequestJson, Writer))
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Failed to serialize the playtest session request.")
        );

        return;
    }

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request =
        FHttpModule::Get().CreateRequest();

    Request->SetURL(SessionsUrl);
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetContentAsString(RequestBody);
    Request->SetTimeout(5.0f);

    Request->OnProcessRequestComplete().BindUObject(
        this,
        &UTelemetrySubsystem::HandleCreateSessionResponse
    );

    UE_LOG(
        LogTelemetry,
        Log,
        TEXT("Creating playtest session at %s. Body: %s"),
        *SessionsUrl,
        *RequestBody
    );

    bSessionRequestInFlight = true;

    if (!Request->ProcessRequest())
    {
        bSessionRequestInFlight = false;

        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Failed to start the playtest session request.")
        );
    }
}

void UTelemetrySubsystem::HandleCreateSessionResponse(
    FHttpRequestPtr /*Request*/,
    FHttpResponsePtr Response,
    bool bWasSuccessful
)
{
    bSessionRequestInFlight = false;

    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Playtest session request failed. No valid HTTP response received.")
        );

        return;
    }

    const int32 StatusCode = Response->GetResponseCode();
    const FString ResponseBody = Response->GetContentAsString();

    if (StatusCode < 200 || StatusCode >= 300)
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Playtest session request returned HTTP %d. Response: %s"),
            StatusCode,
            *ResponseBody
        );

        return;
    }

    TSharedPtr<FJsonObject> ResponseJson;

    const TSharedRef<TJsonReader<>> Reader =
        TJsonReaderFactory<>::Create(ResponseBody);

    if (
        !FJsonSerializer::Deserialize(Reader, ResponseJson) ||
        !ResponseJson.IsValid()
    )
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Failed to parse playtest session response: %s"),
            *ResponseBody
        );

        return;
    }

    if (!ResponseJson->HasField(TEXT("id")))
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Playtest session response does not contain an ID: %s"),
            *ResponseBody
        );

        return;
    }

    CurrentSessionId = ResponseJson->GetIntegerField(TEXT("id"));

    UE_LOG(
        LogTelemetry,
        Display,
        TEXT("Playtest session created successfully. Session ID: %d"),
        CurrentSessionId
    );

    SendTelemetryEvent(
    TEXT("game_started"),
    TEXT("third_person_demo"),
    TEXT(""),
    TEXT("")
    );
}

void UTelemetrySubsystem::SendTelemetryEvent(
    const FString& EventType,
    const FString& Area,
    const FString& QuestId,
    const FString& Stage
)
{
    if (CurrentSessionId == INDEX_NONE)
    {
        UE_LOG(
            LogTelemetry,
            Warning,
            TEXT(
                "Cannot send telemetry event '%s': "
                "no active playtest session exists."
            ),
            *EventType
        );

        return;
    }

    if (EventType.IsEmpty())
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Cannot send a telemetry event with an empty event type.")
        );

        return;
    }

    const FString EventsUrl = BackendBaseUrl + TEXT("/events");

    TSharedRef<FJsonObject> RequestJson = MakeShared<FJsonObject>();

    RequestJson->SetNumberField(
        TEXT("session_id"),
        CurrentSessionId
    );

    RequestJson->SetStringField(
        TEXT("event_type"),
        EventType
    );

    RequestJson->SetStringField(
        TEXT("timestamp"),
        FDateTime::UtcNow().ToIso8601()
    );

    if (!Area.IsEmpty())
    {
        RequestJson->SetStringField(
            TEXT("area"),
            Area
        );
    }

    if (!QuestId.IsEmpty())
    {
        RequestJson->SetStringField(
            TEXT("quest_id"),
            QuestId
        );
    }

    TSharedRef<FJsonObject> PayloadJson = MakeShared<FJsonObject>();

    if (!Stage.IsEmpty())
    {
        PayloadJson->SetStringField(
            TEXT("stage"),
            Stage
        );
    }

    RequestJson->SetObjectField(
        TEXT("payload"),
        PayloadJson
    );

    FString RequestBody;

    TSharedRef<TJsonWriter<>> Writer =
        TJsonWriterFactory<>::Create(&RequestBody);

    if (!FJsonSerializer::Serialize(RequestJson, Writer))
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Failed to serialize telemetry event '%s'."),
            *EventType
        );

        return;
    }

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request =
        FHttpModule::Get().CreateRequest();

    Request->SetURL(EventsUrl);
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetContentAsString(RequestBody);
    Request->SetTimeout(5.0f);

    Request->OnProcessRequestComplete().BindUObject(
        this,
        &UTelemetrySubsystem::HandleCreateEventResponse
    );

    UE_LOG(
        LogTelemetry,
        Log,
        TEXT("Sending telemetry event '%s'. Body: %s"),
        *EventType,
        *RequestBody
    );

    if (!Request->ProcessRequest())
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT("Failed to start telemetry event request '%s'."),
            *EventType
        );
    }
}

void UTelemetrySubsystem::HandleCreateEventResponse(
    FHttpRequestPtr /*Request*/,
    FHttpResponsePtr Response,
    bool bWasSuccessful
)
{
    if (!bWasSuccessful || !Response.IsValid())
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT(
                "Telemetry event request failed. "
                "No valid HTTP response received."
            )
        );

        return;
    }

    const int32 StatusCode = Response->GetResponseCode();
    const FString ResponseBody = Response->GetContentAsString();

    if (StatusCode < 200 || StatusCode >= 300)
    {
        UE_LOG(
            LogTelemetry,
            Error,
            TEXT(
                "Telemetry event request returned HTTP %d. "
                "Response: %s"
            ),
            StatusCode,
            *ResponseBody
        );

        return;
    }

    TSharedPtr<FJsonObject> ResponseJson;

    const TSharedRef<TJsonReader<>> Reader =
        TJsonReaderFactory<>::Create(ResponseBody);

    if (
        FJsonSerializer::Deserialize(Reader, ResponseJson) &&
        ResponseJson.IsValid() &&
        ResponseJson->HasField(TEXT("id"))
    )
    {
        const int32 EventId =
            ResponseJson->GetIntegerField(TEXT("id"));

        UE_LOG(
            LogTelemetry,
            Display,
            TEXT(
                "Telemetry event created successfully. "
                "Event ID: %d"
            ),
            EventId
        );

        return;
    }

    UE_LOG(
        LogTelemetry,
        Display,
        TEXT(
            "Telemetry event created successfully. "
            "Response: %s"
        ),
        *ResponseBody
    );
}