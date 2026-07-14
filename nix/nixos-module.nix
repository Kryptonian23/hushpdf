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

    openFirewall = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Whether to open the firewall port.";
    };
  };

  config = lib.mkIf cfg.enable {
    nixpkgs.overlays = [
      (final: prev: {
        hushpdf = final.callPackage ./package.nix { };
      })
    ];

    systemd.services.hushpdf = {
      description = "HushPDF PDF Tools";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];

      environment = {
        HUSHPDF_PORT = toString cfg.port;
      };

      serviceConfig = {
        ExecStart = "${cfg.package}/bin/hushpdf";
        Restart = "on-failure";
        DynamicUser = true;
        RuntimeDirectory = "hushpdf";
        StateDirectory = "hushpdf";

        # Hardening
        NoNewPrivileges = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        PrivateTmp = true;
        PrivateDevices = true;
        ProtectKernelTunables = true;
        ProtectKernelModules = true;
        ProtectControlGroups = true;
        RestrictSUIDSGID = true;
        MemoryDenyWriteExecute = false;
      };
    };

    networking.firewall.allowedTCPPorts = lib.mkIf cfg.openFirewall [ cfg.port ];
  };
}
