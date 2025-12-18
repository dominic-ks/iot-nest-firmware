{
  description = "Pi Fleet Provisioning for IoT Nest Firmware";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "armv7l-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    in {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in {
          iot-app = pkgs.callPackage ./profiles/services/iot-app.nix {};
        });

      defaultPackage = forAllSystems (system: self.packages.${system}.iot-app);

      devShells = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              nodejs
              yarn
              python3
            ];
          };
        });
    };
}