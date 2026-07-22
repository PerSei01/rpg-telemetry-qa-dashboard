#include "TelemetrySubsystem.h"

#include "Dom/JsonObject.h"
#include "HttpManager.h"
#include "HttpModule.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"

DEFINE_LOG_CATEGORY_STATIC(
    LogTelemetrySubsystem,
    Log,
    All
);

void UTelemetrySubsystem::Initialize(
    FSubsystemCollectionBase& Collection
)
{
    Super::Initialize(Collection);

    CurrentSessionId = INDEX_NONE;
    bSessionRequestInFlight = false;
    bSessionEnded = false;
    PendingEvents.Reset();

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT("Telemetry subsystem initialized.")
    );

    SendTelemetryEvent(
        TEXT("game_started"),
        TEXT("third_person_demo"),
        TEXT(""),
        TEXT("")
    );

    CheckBackendHealth();
}

void UTelemetrySubsystem::Deinitialize()
{
    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT("Telemetry subsystem is shutting down.")
    );

    if (
        CurrentSessionId != INDEX_NONE &&
        !bSessionEnded
    )
    {
        EndPlaytestSession();

        FHttpModule::Get()
            .GetHttpManager()
            .Flush(EHttpFlushReason::FullFlush);
    }
    else if (
        CurrentSessionId == INDEX_NONE &&
        !PendingEvents.IsEmpty()
    )
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Warning,
            TEXT(
                "Telemetry session was not created before "
                "shutdown. %d queued event(s) were not sent."
            ),
            PendingEvents.Num()
        );
    }

    PendingEvents.Reset();
    CurrentSessionId = INDEX_NONE;

    Super::Deinitialize();
}

void UTelemetrySubsystem::CheckBackendHealth()
{
    const TSharedRef<IHttpRequest, ESPMode::ThreadSafe>
        Request =
            FHttpModule::Get().CreateRequest();

    Request->SetURL(
        BackendBaseUrl + TEXT("/health")
    );

    Request->SetVerb(TEXT("GET"));

    Request->OnProcessRequestComplete().BindUObject(
        this,
        &UTelemetrySubsystem::HandleHealthResponse
    );

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT("Checking backend health.")
    );

    Request->ProcessRequest();
}

void UTelemetrySubsystem::StartPlaytestSession()
{
    if (CurrentSessionId != INDEX_NONE)
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Warning,
            TEXT(
                "A playtest session already exists. "
                "Session ID: %d."
            ),
            CurrentSessionId
        );

        return;
    }

    if (bSessionRequestInFlight)
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Warning,
            TEXT(
                "A playtest session request is already "
                "in progress."
            )
        );

        return;
    }

    bSessionRequestInFlight = true;

    const TSharedRef<FJsonObject> JsonObject =
        MakeShared<FJsonObject>();

    JsonObject->SetStringField(
        TEXT("player_name"),
        TEXT("UE5Player")
    );

    JsonObject->SetStringField(
        TEXT("build_version"),
        TEXT("ue5-demo-0.1.0")
    );

    FString RequestBody;

    const TSharedRef<TJsonWriter<>> Writer =
        TJsonWriterFactory<>::Create(&RequestBody);

    FJsonSerializer::Serialize(
        JsonObject,
        Writer
    );

    const TSharedRef<IHttpRequest, ESPMode::ThreadSafe>
        Request =
            FHttpModule::Get().CreateRequest();

    Request->SetURL(
        BackendBaseUrl + TEXT("/sessions")
    );

    Request->SetVerb(TEXT("POST"));

    Request->SetHeader(
        TEXT("Content-Type"),
        TEXT("application/json")
    );

    Request->SetContentAsString(RequestBody);

    Request->OnProcessRequestComplete().BindUObject(
        this,
        &UTelemetrySubsystem::
            HandleCreateSessionResponse
    );

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT("Creating a new playtest session.")
    );

    if (!Request->ProcessRequest())
    {
        bSessionRequestInFlight = false;

        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Failed to start the playtest "
                "session request."
            )
        );
    }
}

void UTelemetrySubsystem::SendTelemetryEvent(
    const FString& EventType,
    const FString& Area,
    const FString& QuestId,
    const FString& Stage
)
{
    if (EventType.IsEmpty())
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Warning,
            TEXT(
                "Cannot send a telemetry event "
                "without an event type."
            )
        );

        return;
    }

    if (
        bSessionEnded &&
        EventType != TEXT("game_ended")
    )
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Warning,
            TEXT(
                "Ignoring telemetry event '%s': "
                "the playtest session has ended."
            ),
            *EventType
        );

        return;
    }

    const FString Timestamp =
        FDateTime::UtcNow().ToIso8601();

    if (CurrentSessionId == INDEX_NONE)
    {
        PendingEvents.Add(
            {
                EventType,
                Area,
                QuestId,
                Stage,
                Timestamp
            }
        );

        UE_LOG(
            LogTelemetrySubsystem,
            Display,
            TEXT(
                "Queued telemetry event '%s' until "
                "a playtest session is available."
            ),
            *EventType
        );

        return;
    }

    SubmitTelemetryEvent(
        EventType,
        Area,
        QuestId,
        Stage,
        Timestamp
    );
}

void UTelemetrySubsystem::EndPlaytestSession()
{
    if (bSessionEnded)
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Display,
            TEXT(
                "Playtest session %d has already ended."
            ),
            CurrentSessionId
        );

        return;
    }

    if (CurrentSessionId == INDEX_NONE)
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Warning,
            TEXT(
                "Cannot end the playtest session: "
                "no session ID is available."
            )
        );

        return;
    }

    bSessionEnded = true;

    SendTelemetryEvent(
        TEXT("game_ended"),
        TEXT("third_person_demo"),
        TEXT(""),
        TEXT("")
    );

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT(
            "Ending playtest session %d."
        ),
        CurrentSessionId
    );
}

void UTelemetrySubsystem::FlushPendingEvents()
{
    if (
        CurrentSessionId == INDEX_NONE ||
        PendingEvents.IsEmpty()
    )
    {
        return;
    }

    TArray<FPendingTelemetryEvent> EventsToFlush =
        MoveTemp(PendingEvents);

    PendingEvents.Reset();

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT(
            "Sending %d queued telemetry event(s)."
        ),
        EventsToFlush.Num()
    );

    for (
        const FPendingTelemetryEvent& Event
        : EventsToFlush
    )
    {
        SubmitTelemetryEvent(
            Event.EventType,
            Event.Area,
            Event.QuestId,
            Event.Stage,
            Event.Timestamp
        );
    }
}

void UTelemetrySubsystem::SubmitTelemetryEvent(
    const FString& EventType,
    const FString& Area,
    const FString& QuestId,
    const FString& Stage,
    const FString& Timestamp
)
{
    if (CurrentSessionId == INDEX_NONE)
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Cannot submit telemetry event '%s': "
                "no session ID is available."
            ),
            *EventType
        );

        return;
    }

    const TSharedRef<FJsonObject> JsonObject =
        MakeShared<FJsonObject>();

    JsonObject->SetNumberField(
        TEXT("session_id"),
        CurrentSessionId
    );

    JsonObject->SetStringField(
        TEXT("event_type"),
        EventType
    );

    JsonObject->SetStringField(
        TEXT("timestamp"),
        Timestamp
    );

    if (!Area.IsEmpty())
    {
        JsonObject->SetStringField(
            TEXT("area"),
            Area
        );
    }

    if (!QuestId.IsEmpty())
    {
        JsonObject->SetStringField(
            TEXT("quest_id"),
            QuestId
        );
    }

    const TSharedRef<FJsonObject> PayloadObject =
        MakeShared<FJsonObject>();

    if (!Stage.IsEmpty())
    {
        PayloadObject->SetStringField(
            TEXT("stage"),
            Stage
        );
    }

    JsonObject->SetObjectField(
        TEXT("payload"),
        PayloadObject
    );

    FString RequestBody;

    const TSharedRef<TJsonWriter<>> Writer =
        TJsonWriterFactory<>::Create(&RequestBody);

    FJsonSerializer::Serialize(
        JsonObject,
        Writer
    );

    const TSharedRef<IHttpRequest, ESPMode::ThreadSafe>
        Request =
            FHttpModule::Get().CreateRequest();

    Request->SetURL(
        BackendBaseUrl + TEXT("/events")
    );

    Request->SetVerb(TEXT("POST"));

    Request->SetHeader(
        TEXT("Content-Type"),
        TEXT("application/json")
    );

    Request->SetContentAsString(RequestBody);

    Request->OnProcessRequestComplete().BindUObject(
        this,
        &UTelemetrySubsystem::
            HandleCreateEventResponse
    );

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT(
            "Sending telemetry event '%s' "
            "for session %d."
        ),
        *EventType,
        CurrentSessionId
    );

    if (!Request->ProcessRequest())
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Failed to start request for "
                "telemetry event '%s'."
            ),
            *EventType
        );
    }
}

void UTelemetrySubsystem::HandleHealthResponse(
    FHttpRequestPtr /*Request*/,
    FHttpResponsePtr Response,
    bool bWasSuccessful
)
{
    if (
        !bWasSuccessful ||
        !Response.IsValid()
    )
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Backend health request failed. "
                "Make sure FastAPI is running."
            )
        );

        return;
    }

    const int32 ResponseCode =
        Response->GetResponseCode();

    if (!EHttpResponseCodes::IsOk(ResponseCode))
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Backend health request returned "
                "HTTP %d."
            ),
            ResponseCode
        );

        return;
    }

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT(
            "Backend is healthy. Response: %s"
        ),
        *Response->GetContentAsString()
    );

    StartPlaytestSession();
}

void UTelemetrySubsystem::HandleCreateSessionResponse(
    FHttpRequestPtr /*Request*/,
    FHttpResponsePtr Response,
    bool bWasSuccessful
)
{
    bSessionRequestInFlight = false;

    if (
        !bWasSuccessful ||
        !Response.IsValid()
    )
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Playtest session request failed."
            )
        );

        return;
    }

    const int32 ResponseCode =
        Response->GetResponseCode();

    if (!EHttpResponseCodes::IsOk(ResponseCode))
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Playtest session request returned "
                "HTTP %d. Response: %s"
            ),
            ResponseCode,
            *Response->GetContentAsString()
        );

        return;
    }

    TSharedPtr<FJsonObject> ResponseObject;

    const TSharedRef<TJsonReader<>> Reader =
        TJsonReaderFactory<>::Create(
            Response->GetContentAsString()
        );

    if (
        !FJsonSerializer::Deserialize(
            Reader,
            ResponseObject
        ) ||
        !ResponseObject.IsValid()
    )
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Could not parse the playtest "
                "session response."
            )
        );

        return;
    }

    double SessionIdValue = 0.0;

    if (
        !ResponseObject->TryGetNumberField(
            TEXT("id"),
            SessionIdValue
        )
    )
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Playtest session response did not "
                "contain a valid session ID."
            )
        );

        return;
    }

    CurrentSessionId =
        static_cast<int32>(SessionIdValue);

    bSessionEnded = false;

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT(
            "Created playtest session %d."
        ),
        CurrentSessionId
    );

    FlushPendingEvents();
}

void UTelemetrySubsystem::HandleCreateEventResponse(
    FHttpRequestPtr /*Request*/,
    FHttpResponsePtr Response,
    bool bWasSuccessful
)
{
    if (
        !bWasSuccessful ||
        !Response.IsValid()
    )
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT("Telemetry event request failed.")
        );

        return;
    }

    const int32 ResponseCode =
        Response->GetResponseCode();

    if (!EHttpResponseCodes::IsOk(ResponseCode))
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Error,
            TEXT(
                "Telemetry event request returned "
                "HTTP %d. Response: %s"
            ),
            ResponseCode,
            *Response->GetContentAsString()
        );

        return;
    }

    TSharedPtr<FJsonObject> ResponseObject;

    const TSharedRef<TJsonReader<>> Reader =
        TJsonReaderFactory<>::Create(
            Response->GetContentAsString()
        );

    double EventIdValue = 0.0;

    if (
        FJsonSerializer::Deserialize(
            Reader,
            ResponseObject
        ) &&
        ResponseObject.IsValid() &&
        ResponseObject->TryGetNumberField(
            TEXT("id"),
            EventIdValue
        )
    )
    {
        UE_LOG(
            LogTelemetrySubsystem,
            Display,
            TEXT(
                "Telemetry event created. Event ID: %d."
            ),
            static_cast<int32>(EventIdValue)
        );

        return;
    }

    UE_LOG(
        LogTelemetrySubsystem,
        Display,
        TEXT(
            "Telemetry event created successfully."
        )
    );
}