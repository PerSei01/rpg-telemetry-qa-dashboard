#pragma once

#include "CoreMinimal.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "TelemetrySubsystem.generated.h"

struct FPendingTelemetryEvent final
{
    FString EventType;
    FString Area;
    FString QuestId;
    FString Stage;
    FString Timestamp;
};

UCLASS()
class RPGTELEMETRYDEMO_API UTelemetrySubsystem
    : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(
        FSubsystemCollectionBase& Collection
    ) override;

    virtual void Deinitialize() override;

    UFUNCTION(BlueprintCallable, Category = "Telemetry")
    void CheckBackendHealth();

    UFUNCTION(BlueprintCallable, Category = "Telemetry")
    void SendTelemetryEvent(
        const FString& EventType,
        const FString& Area,
        const FString& QuestId,
        const FString& Stage
    );

    UFUNCTION(BlueprintCallable, Category = "Telemetry")
    void EndPlaytestSession();

private:
    void StartPlaytestSession();

    void FlushPendingEvents();

    void SubmitTelemetryEvent(
        const FString& EventType,
        const FString& Area,
        const FString& QuestId,
        const FString& Stage,
        const FString& Timestamp
    );

    void HandleHealthResponse(
        FHttpRequestPtr Request,
        FHttpResponsePtr Response,
        bool bWasSuccessful
    );

    void HandleCreateSessionResponse(
        FHttpRequestPtr Request,
        FHttpResponsePtr Response,
        bool bWasSuccessful
    );

    void HandleCreateEventResponse(
        FHttpRequestPtr Request,
        FHttpResponsePtr Response,
        bool bWasSuccessful
    );

    FString BackendBaseUrl =
        TEXT("http://127.0.0.1:8000");

    int32 CurrentSessionId = INDEX_NONE;

    bool bSessionRequestInFlight = false;
    bool bSessionEnded = false;

    TArray<FPendingTelemetryEvent> PendingEvents;
};