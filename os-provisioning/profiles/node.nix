{ pkgs }:

{
  packages = with pkgs; [
    nodejs_18
    yarn
  ];
}