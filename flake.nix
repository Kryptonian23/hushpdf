{
  description = "HushPDF - Professional PDF Tools, Free, Private & Browser-Based";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" ];

      # Overlay that provides hushpdf package on any system
      overlay = final: prev: {
        hushpdf = final.callPackage ./nix/package.nix { };
      };
    in
    {
      # NixOS module
      nixosModules.default = import ./nix/nixos-module.nix;
      nixosModules.hushpdf = self.nixosModules.default;

      # Home-manager module
      homeManagerModules.default = import ./nix/hm-module.nix;
      homeManagerModules.hushpdf = self.homeManagerModules.default;

      # Overlay
      overlays.default = overlay;
    }
    //
    flake-utils.lib.eachSystem supportedSystems (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ overlay ];
        };
      in
      {
        packages = {
          hushpdf = pkgs.hushpdf;
          default = pkgs.hushpdf;
        };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            nginx
          ];
        };
      }
    );
}
