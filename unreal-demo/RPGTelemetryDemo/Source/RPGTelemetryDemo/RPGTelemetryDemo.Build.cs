// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class RPGTelemetryDemo : ModuleRules
{
    public RPGTelemetryDemo(
        ReadOnlyTargetRules Target
    ) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(
            new string[]
            {
                "Core",
                "CoreUObject",
                "Engine",
                "InputCore",
                "EnhancedInput",
                "HTTP",
                "Json"
            }
        );

        PrivateDependencyModuleNames.AddRange(
            new string[]
            {
                "Slate"
            }
        );
    }
}