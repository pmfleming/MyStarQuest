{
  description = "Nix dev environment for MyStarQuest";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
      pkgsFor = system: import nixpkgs {
        inherit system;
        config = {
          allowUnfree = true;
          android_sdk.accept_license = true;
        };
      };
    in {
      devShells = forAllSystems (system:
        let
          pkgs = pkgsFor system;
          android = pkgs.androidenv.composeAndroidPackages {
            platformVersions = [ "36" ];
            buildToolsVersions = [ "36.0.0" ];
            includeEmulator = false;
            includeSystemImages = false;
            includeSources = false;
            includeNDK = false;
          };
          androidSdkRoot = "${android.androidsdk}/libexec/android-sdk";
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_22
              firebase-tools
              jdk21
              gradle_9
              git
              android.androidsdk
              android-tools
            ];

            ANDROID_HOME = androidSdkRoot;
            ANDROID_SDK_ROOT = androidSdkRoot;
            JAVA_HOME = pkgs.jdk21.home;
            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidSdkRoot}/build-tools/36.0.0/aapt2";
            shellHook = ''
              export PATH="$ANDROID_SDK_ROOT/platform-tools:$PATH"
              echo "MyStarQuest dev shell"
              echo "Node: $(node --version) | npm: $(npm --version)"
              echo "Android SDK: $ANDROID_SDK_ROOT"
            '';
          };
        });
    };
}
