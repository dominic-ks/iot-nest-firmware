{ pkgs }:

{
  packages = with pkgs; [
    nodejs_18
    yarn
    python3
    git
    vim
  ];
}