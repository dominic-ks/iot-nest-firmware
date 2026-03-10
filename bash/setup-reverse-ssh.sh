#!/bin/bash

set -euo pipefail

run_as_device_user() {
    if [ "$(id -un)" = "$DEVICE_USER" ]; then
        "$@"
    else
        sudo -u "$DEVICE_USER" -H "$@"
    fi
}

DEVICE_USER="${SUDO_USER:-$USER}"
DEVICE_HOME="$(getent passwd "$DEVICE_USER" | cut -d: -f6)"
DEVICE_CONFIG_DIR="$DEVICE_HOME/.config/device"
DEVICE_ENV_FILE="$DEVICE_CONFIG_DIR/.env"
AUTOSSH_KEY_PATH="$DEVICE_HOME/.ssh/id_rsa"
AUTOSSH_HELPER="/usr/local/bin/device-reverse-ssh"
AUTOSSH_SERVICE="/etc/systemd/system/device-reverse-ssh.service"

echo "Installing reverse SSH dependencies..."
apt-get update
apt-get install -y autossh openssh-client

echo "Creating device config directory..."
run_as_device_user mkdir -p "$DEVICE_CONFIG_DIR"
run_as_device_user chmod 700 "$DEVICE_CONFIG_DIR"

if [ ! -f "$AUTOSSH_KEY_PATH" ]; then
    echo "Missing SSH key: $AUTOSSH_KEY_PATH" >&2
    exit 1
fi
run_as_device_user chmod 600 "$AUTOSSH_KEY_PATH"

if [ ! -f "$DEVICE_ENV_FILE" ]; then
    run_as_device_user tee "$DEVICE_ENV_FILE" >/dev/null <<EOF
DOCKERPROFILES=app
REVERSE_SSH_HOST=
REVERSE_SSH_PORT=22
REVERSE_SSH_USER=
REVERSE_SSH_REMOTE_PORT=
REVERSE_SSH_LOCAL_PORT=22
EOF
    run_as_device_user chmod 600 "$DEVICE_ENV_FILE"
fi

tee "$AUTOSSH_HELPER" >/dev/null <<EOF
#!/bin/bash
set -euo pipefail

ENV_FILE="\${DEVICE_ENV_FILE:-$DEVICE_ENV_FILE}"

if [ ! -f "\$ENV_FILE" ]; then
    echo "Missing env file: \$ENV_FILE" >&2
    exit 1
fi

set -a
source "\$ENV_FILE"
set +a

: "\${REVERSE_SSH_HOST:?REVERSE_SSH_HOST is required}"
: "\${REVERSE_SSH_USER:?REVERSE_SSH_USER is required}"
: "\${REVERSE_SSH_REMOTE_PORT:?REVERSE_SSH_REMOTE_PORT is required}"

KEY_PATH="\${REVERSE_SSH_KEY_PATH:-$AUTOSSH_KEY_PATH}"
SSH_PORT="\${REVERSE_SSH_PORT:-22}"
LOCAL_PORT="\${REVERSE_SSH_LOCAL_PORT:-22}"

exec /usr/bin/autossh -M 0 -N \
    -o "ExitOnForwardFailure=yes" \
    -o "ServerAliveInterval=30" \
    -o "ServerAliveCountMax=3" \
    -o "StrictHostKeyChecking=accept-new" \
    -o "UserKnownHostsFile=$DEVICE_CONFIG_DIR/known_hosts" \
    -i "\$KEY_PATH" \
    -p "\$SSH_PORT" \
    -R "\${REVERSE_SSH_REMOTE_PORT}:localhost:\${LOCAL_PORT}" \
    "\${REVERSE_SSH_USER}@\${REVERSE_SSH_HOST}"
EOF
chmod 755 "$AUTOSSH_HELPER"

tee "$AUTOSSH_SERVICE" >/dev/null <<EOF
[Unit]
Description=Persistent reverse SSH tunnel for device access
After=network-online.target
Wants=network-online.target

[Service]
User=$DEVICE_USER
Environment=DEVICE_ENV_FILE=$DEVICE_ENV_FILE
Environment=AUTOSSH_GATETIME=0
ExecStart=$AUTOSSH_HELPER
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable device-reverse-ssh.service

echo "Add REVERSE_SSH_* values to $DEVICE_ENV_FILE, ensure $AUTOSSH_KEY_PATH is authorized on the tunnel host, then start:"
echo "  sudo systemctl start device-reverse-ssh.service"
