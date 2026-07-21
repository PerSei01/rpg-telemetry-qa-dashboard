#include "TelemetryTrigger.h"

#include "Components/BoxComponent.h"
#include "Engine/GameInstance.h"
#include "GameFramework/Pawn.h"
#include "TelemetrySubsystem.h"

DEFINE_LOG_CATEGORY_STATIC(LogTelemetryTrigger, Log, All);

ATelemetryTrigger::ATelemetryTrigger()
{
    PrimaryActorTick.bCanEverTick = false;

    TriggerBox = CreateDefaultSubobject<UBoxComponent>(
        TEXT("TriggerBox")
    );

    SetRootComponent(TriggerBox);

    TriggerBox->SetBoxExtent(
        FVector(150.0f, 150.0f, 100.0f)
    );

    TriggerBox->SetCollisionEnabled(
        ECollisionEnabled::QueryOnly
    );

    TriggerBox->SetCollisionObjectType(
        ECC_WorldDynamic
    );

    TriggerBox->SetCollisionResponseToAllChannels(
        ECR_Ignore
    );

    TriggerBox->SetCollisionResponseToChannel(
        ECC_Pawn,
        ECR_Overlap
    );

    TriggerBox->SetGenerateOverlapEvents(true);

    TriggerBox->OnComponentBeginOverlap.AddDynamic(
        this,
        &ATelemetryTrigger::HandleBeginOverlap
    );
}

void ATelemetryTrigger::HandleBeginOverlap(
    UPrimitiveComponent* /*OverlappedComponent*/,
    AActor* OtherActor,
    UPrimitiveComponent* /*OtherComponent*/,
    int32 /*OtherBodyIndex*/,
    bool /*bFromSweep*/,
    const FHitResult& /*SweepResult*/
)
{
    const APawn* OverlappingPawn = Cast<APawn>(OtherActor);

    if (
        !IsValid(OverlappingPawn) ||
        !OverlappingPawn->IsPlayerControlled()
    )
    {
        return;
    }

    if (bTriggerOnce && bHasTriggered)
    {
        return;
    }

    UGameInstance* GameInstance = GetGameInstance();

    if (!IsValid(GameInstance))
    {
        UE_LOG(
            LogTelemetryTrigger,
            Error,
            TEXT("Cannot send telemetry: GameInstance is unavailable.")
        );

        return;
    }

    UTelemetrySubsystem* TelemetrySubsystem =
        GameInstance->GetSubsystem<UTelemetrySubsystem>();

    if (!IsValid(TelemetrySubsystem))
    {
        UE_LOG(
            LogTelemetryTrigger,
            Error,
            TEXT("Cannot send telemetry: TelemetrySubsystem is unavailable.")
        );

        return;
    }

    TelemetrySubsystem->SendTelemetryEvent(
        EventType,
        Area,
        QuestId,
        Stage
    );

    bHasTriggered = true;

    UE_LOG(
        LogTelemetryTrigger,
        Display,
        TEXT(
            "Player entered telemetry trigger. "
            "Event: %s. Area: %s."
        ),
        *EventType,
        *Area
    );
}