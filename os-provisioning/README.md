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
- `deployment/`: Deployment scripts organized by build type
  - `gcloud-test/`: Scripts for provisioning and testing on Google Cloud VM
  - `rpi-build/`: Scripts for deploying to Raspberry Pi

## Usage

### Raspberry Pi Deployment

1. Build the application locally: `cd ../../ && npm run build` (assuming the app is in the parent directory)
2. Flash Raspberry Pi OS Lite to SD card
3. Boot Pi, connect via SSH
4. Copy the provisioning files and run bootstrap: `scp -r os-provisioning pi@<pi-ip>:~/ && ssh pi@<pi-ip> "cd ~/os-provisioning && ./deployment/gcloud-test/bootstrap-nix.sh"`
5. Apply provisioning: `ssh pi@<pi-ip> "cd ~/os-provisioning && ./deployment/gcloud-test/apply.sh"`
6. Deploy the app: `./deployment/rpi-build/deploy.sh` (configure .env.rpi-build first)

### Google Cloud VM Testing

For fast development iteration, use the provided scripts to manage a disposable Ubuntu VM on Google Cloud.

- **Provision VM**: Run `./deployment/gcloud-test/provision-vm.sh` to create the VM with Nix pre-installed.
- **Tear down VM**: Run `./deployment/gcloud-test/teardown-vm.sh` to delete the VM.
- **Connect**: Use `gcloud compute ssh iot-rpi-dev-box --zone=europe-west2-a` or VS Code Remote SSH.

Configure project and VM details in `deployment/gcloud-test/.env.gcloud-test`.

#### Development Cycle
1. Edit flake/profiles locally in your workspace.
2. Copy changes to the VM: `./deployment/gcloud-test/copy-to-vm.sh`
3. SSH to VM and re-run: `cd ~/os-provisioning && ./deployment/gcloud-test/apply.sh`
4. Test updates; repeat as needed.
5. Tear down when done: `./deployment/gcloud-test/teardown-vm.sh`

## Principles

- Declarative and idempotent
- One flake for all architectures
- VM for development, Pi for validation