{ config, lib, pkgs, ... }:

let
  cfg = config.services.hushpdf;
in
{
  options.services.hushpdf = {
    enable = lib.mkEnableOption "HushPDF - Professional PDF Tools";

    package = lib.mkOption {
      type = lib.types.package;
      default = pkgs.hushpdf;
      defaultText = lib.literalExpression "pkgs.hushpdf";
      description = "The HushPDF package to use.";
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 3000;
      description = "Port to listen on.";
    };
  };

  config = lib.mkIf cfg.enable {
    nixpkgs.overlays = [
      (final: prev: {
        hushpdf = final.callPackage ./package.nix { };
      })
    ];

    systemd.user.services.hushpdf = {
      Unit = {
        Description = "HushPDF PDF Tools";
        After = [ "network.target" ];
      };

      Service = {
        ExecStart = "${cfg.package}/bin/hushpdf";
        Restart = "on-failure";
        Environment = [
          "HUSHPDF_PORT=${toString cfg.port}"
        ];
      };

      Install = {
        WantedBy = [ "default.target" ];
      };
    };
  };
}
