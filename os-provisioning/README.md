# Pi Fleet Provisioning for IoT Nest Firmware

This directory contains the provisioning system for deploying the IoT Nest Firmware to a fleet of Raspberry Pis using Nix.

## Architecture

- Base OS: Raspberry Pi OS Lite (32-bit armhf for Pi Zero, 64-bit arm64 for Pi Zero 2)
- Provisioning: Nix package manager with flakes
- Development: Ubuntu VM for fast iteration

## Structure

- `flake.nix`: Main flake definition
- `profiles/`: Declarative profiles for packages and configurations
- `systemd/`: Service definitions
- `scripts/`: Bootstrap and apply scripts

## Usage

1. Flash Raspberry Pi OS Lite to SD card
2. Boot Pi, run `scripts/bootstrap-nix.sh` to install Nix
3. Clone repo, cd to `os-provisioning`
4. Run `scripts/apply.sh` to apply provisioning

## Development

Use the dev shell: `nix develop`

Build the app: `nix build .#iot-app`

### GCP VM Setup

For fast development iteration, use the provided scripts to manage a disposable Ubuntu VM on Google Cloud.

- **Provision VM**: Run `scripts/provision-vm.sh` to create the VM with Nix pre-installed.
- **Tear down VM**: Run `scripts/teardown-vm.sh` to delete the VM.
- **Connect**: Use `gcloud compute ssh iot-rpi-dev-box --zone=europe-west2-a` or VS Code Remote SSH.

Configure project and VM details in `.env`.

#### Development Cycle
1. Edit flake/profiles locally in your workspace.
2. Copy changes to the VM: `gcloud compute scp --zone=europe-west2-a /path/to/changed/file iot-rpi-dev-box:~/os-provisioning/`
3. SSH to VM and re-run: `cd ~/os-provisioning && ./scripts/apply.sh`
4. Test updates; repeat as needed.
5. Tear down when done: `./scripts/teardown-vm.sh`

## Principles

- Declarative and idempotent
- One flake for all architectures
- VM for development, Pi for validation