#!/bin/bash
# Run this script in a regular Terminal window to install CocoaPods and set up iOS
set -e

echo "=== BreakLingo iOS Setup ==="

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "CocoaPods not found. Installing..."

    # Try brew first
    if command -v brew &> /dev/null; then
        brew install cocoapods
    else
        echo "Installing via gem..."
        gem install cocoapods --user-install --no-document

        # Add user gem bin to PATH
        export PATH="$(ruby -e 'puts Gem.user_dir')/bin:$PATH"
    fi
fi

echo "CocoaPods version: $(pod --version)"

echo ""
echo "=== Running pod install ==="
cd "$(dirname "$0")/ios"
pod install

echo ""
echo "=== Done! ==="
echo "Now open Xcode and build:"
echo "  open BreakLingoIOS.xcworkspace"
echo "  (or press Cmd+R to build & run)"
