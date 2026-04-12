#!/bin/bash

set -e

GITHUB_REPO="max-collomb/jellyplay-client"
APP_NAME="Jellyplay-Electron-Client"
APP_DISPLAY_NAME="Jellyplay"
INSTALL_DIR="/opt"
ICON_URL="https://raw.githubusercontent.com/${GITHUB_REPO}/master/assets/icons/256x256.png"
APPIMAGE_DEST="$INSTALL_DIR/$APP_NAME.AppImage"
ICON_DEST="$INSTALL_DIR/jellyplay.png"

# Determine the real user's home directory (works whether called with sudo or not)
if [ -n "$SUDO_USER" ]; then
    USER_HOME=$(getent passwd "$SUDO_USER" | cut -d: -f6)
else
    USER_HOME="$HOME"
fi

DESKTOP_PATH="$USER_HOME/.local/share/applications"
DESKTOP_FILE="$DESKTOP_PATH/$APP_NAME.desktop"

# Helper: print a step and run a command, then print Done
run_step() {
    local label="$1"
    shift
    echo -n "==> $label... "
    "$@"
    echo -e "\033[32mOK\033[0m"
}

# Fetch latest AppImage download URL from GitHub releases API
echo -n "==> Récupération de la dernière version... "
DOWNLOAD_URL=$(curl -fsSL "https://api.github.com/repos/${GITHUB_REPO}/releases/latest" \
    | grep -o '"browser_download_url": "[^"]*\.AppImage"' \
    | cut -d'"' -f4)

if [ -z "$DOWNLOAD_URL" ]; then
    echo -e "\033[31mErreur\033[0m"
    echo "Impossible de trouver l'AppImage dans la dernière release GitHub."
    exit 1
fi
echo -e "\033[32mOK\033[0m"
echo "    $DOWNLOAD_URL"

# Download AppImage to a temp file then move to /opt
TMP_APPIMAGE=$(mktemp /tmp/jellyplay-XXXXXX.AppImage)
run_step "Téléchargement de l'AppImage" curl -fsSL --progress-bar -o "$TMP_APPIMAGE" "$DOWNLOAD_URL"
chmod +x "$TMP_APPIMAGE"
run_step "Installation dans $INSTALL_DIR" sudo mv "$TMP_APPIMAGE" "$APPIMAGE_DEST"
sudo chmod +x "$APPIMAGE_DEST"

# Download icon
TMP_ICON=$(mktemp /tmp/jellyplay-XXXXXX.png)
run_step "Téléchargement de l'icône" curl -fsSL -o "$TMP_ICON" "$ICON_URL"
run_step "Installation de l'icône" sudo mv "$TMP_ICON" "$ICON_DEST"

# Create .desktop entry
run_step "Création du raccourci bureau" bash -c "
mkdir -p '$DESKTOP_PATH'
cat > '$DESKTOP_FILE' <<EOF
[Desktop Entry]
Name=$APP_DISPLAY_NAME
Comment=Jellyplay Electron Client
Exec=$APPIMAGE_DEST --no-sandbox
Icon=$ICON_DEST
Terminal=false
Type=Application
Categories=AudioVideo;Video;
StartupWMClass=jellyplay-electron-client
EOF
chmod +x '$DESKTOP_FILE'
"

# Refresh desktop database
update-desktop-database "$DESKTOP_PATH" 2>/dev/null || true

echo ""
echo "Installation terminée !"
echo "  AppImage : $APPIMAGE_DEST"
echo "  Icône    : $ICON_DEST"
echo "  Raccourci: $DESKTOP_FILE"
echo ""
echo "$APP_DISPLAY_NAME est maintenant disponible dans votre lanceur d'applications."
echo "Les mises à jour seront gérées automatiquement par l'application."
