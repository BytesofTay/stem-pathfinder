#!/bin/zsh
# Cron wrapper for the STEM Pathfinder school directory updater.
# Logs to update_schools.log next to this script.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "/Users/hi/LAUSD MAGNET DATA"
/usr/bin/python3 update_schools.py >> update_schools.log 2>&1
