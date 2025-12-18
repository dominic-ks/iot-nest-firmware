{ pkgs }:

pkgs.stdenv.mkDerivation rec {
  pname = "iot-nest-firmware";
  version = "1.0.0";

  src = builtins.path { path = "/home/dominicks/iot-nest-firmware"; name = "iot-nest-firmware"; };

  buildInputs = [ pkgs.makeWrapper ];

  installPhase = ''
    mkdir -p $out/bin $out/libexec
    cp -r dist/* $out/libexec/
    cp -r node_modules $out/libexec/
    cat > $out/bin/iot-app <<EOF
    #!/bin/sh
    cd $out/libexec
    exec ${pkgs.nodejs}/bin/node main.js
    EOF
    chmod +x $out/bin/iot-app
  '';
}