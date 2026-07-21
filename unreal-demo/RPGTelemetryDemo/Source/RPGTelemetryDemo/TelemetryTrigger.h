#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "TelemetryTrigger.generated.h"

class UBoxComponent;
class UPrimitiveComponent;

UCLASS()
class RPGTELEMETRYDEMO_API ATelemetryTrigger : public AActor
{
    GENERATED_BODY()

public:
    ATelemetryTrigger();

protected:
    UPROPERTY(
        VisibleAnywhere,
        BlueprintReadOnly,
        Category = "Telemetry"
    )
    TObjectPtr<UBoxComponent> TriggerBox;

    UPROPERTY(
        EditAnywhere,
        BlueprintReadOnly,
        Category = "Telemetry"
    )
    FString EventType = TEXT("entered_area");

    UPROPERTY(
        EditAnywhere,
        BlueprintReadOnly,
        Category = "Telemetry"
    )
    FString Area = TEXT("demo_area");

    UPROPERTY(
        EditAnywhere,
        BlueprintReadOnly,
        Category = "Telemetry"
    )
    FString QuestId;

    UPROPERTY(
        EditAnywhere,
        BlueprintReadOnly,
        Category = "Telemetry"
    )
    FString Stage;

    UPROPERTY(
        EditAnywhere,
        BlueprintReadOnly,
        Category = "Telemetry"
    )
    bool bTriggerOnce = true;

private:
    UFUNCTION()
    void HandleBeginOverlap(
        UPrimitiveComponent* OverlappedComponent,
        AActor* OtherActor,
        UPrimitiveComponent* OtherComponent,
        int32 OtherBodyIndex,
        bool bFromSweep,
        const FHitResult& SweepResult
    );

    bool bHasTriggered = false;
};