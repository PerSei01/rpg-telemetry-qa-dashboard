// Copyright Epic Games, Inc. All Rights Reserved.

using UnrealBuildTool;

public class RPGTelemetryDemo : ModuleRules
{
	public RPGTelemetryDemo(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[] {
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"EnhancedInput",
			"AIModule",
			"StateTreeModule",
			"GameplayStateTreeModule",
			"UMG",
			"Slate",
			"HTTP",
			"Json"
		});

		PrivateDependencyModuleNames.AddRange(new string[] { });

		PublicIncludePaths.AddRange(new string[] {
			"RPGTelemetryDemo",
			"RPGTelemetryDemo/Variant_Platforming",
			"RPGTelemetryDemo/Variant_Platforming/Animation",
			"RPGTelemetryDemo/Variant_Combat",
			"RPGTelemetryDemo/Variant_Combat/AI",
			"RPGTelemetryDemo/Variant_Combat/Animation",
			"RPGTelemetryDemo/Variant_Combat/Gameplay",
			"RPGTelemetryDemo/Variant_Combat/Interfaces",
			"RPGTelemetryDemo/Variant_Combat/UI",
			"RPGTelemetryDemo/Variant_SideScrolling",
			"RPGTelemetryDemo/Variant_SideScrolling/AI",
			"RPGTelemetryDemo/Variant_SideScrolling/Gameplay",
			"RPGTelemetryDemo/Variant_SideScrolling/Interfaces",
			"RPGTelemetryDemo/Variant_SideScrolling/UI"
		});

		// Uncomment if you are using Slate UI
		// PrivateDependencyModuleNames.AddRange(new string[] { "Slate", "SlateCore" });

		// Uncomment if you are using online features
		// PrivateDependencyModuleNames.Add("OnlineSubsystem");

		// To include OnlineSubsystemSteam, add it to the plugins section in your uproject file with the Enabled attribute set to true
	}
}
