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
          nodejs = pkgs.nodejs_24.overrideAttrs (_: {
            version = "24.21.0";
            src = pkgs.fetchurl {
              url = "https://nodejs.org/dist/v24.21.0/node-v24.21.0.tar.xz";
              sha256 = "a6f54defb6fd7c84f41dba13d61e78e9b4e0961712cf61f29715c05f5ced94fc";
            };
          });
          sdkRepo = builtins.fromJSON (builtins.readFile "${nixpkgs}/pkgs/development/mobile/androidenv/repo.json");
          android = pkgs.androidenv.composeAndroidPackages {
            # Add Google's stable 37.2 package until the Nix catalogue includes it.
            repo = sdkRepo // {
              packages = sdkRepo.packages // {
                platforms = sdkRepo.packages.platforms // {
                  "37.2" = builtins.fromJSON (builtins.readFile ./android/sdk-platform-37.2.json);
                };
              };
            };
            platformVersions = [ "37.0" "37.2" ];
            buildToolsVersions = [ "37.0.0" ];
            includeEmulator = false;
            includeSystemImages = false;
            includeSources = false;
            includeNDK = false;
          };
          androidSdkRoot = "${android.androidsdk}/libexec/android-sdk";
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs
              firebase-tools
              jdk25
              gradle_9
              git
              android.androidsdk
              android-tools
            ];

            ANDROID_HOME = androidSdkRoot;
            ANDROID_SDK_ROOT = androidSdkRoot;
            JAVA_HOME = pkgs.jdk25.home;
            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${androidSdkRoot}/build-tools/37.0.0/aapt2";
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
