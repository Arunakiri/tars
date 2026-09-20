#!/bin/bash

set -euo pipefail

LOCK_DIR="/tmp/chronos.lock"
PID_FILE="$LOCK_DIR/pid"

CAFFEINATE_PID=""
CLEANUP_DONE=0


cleanup() {
    # Prevent cleanup from running twice.
    if [[ "$CLEANUP_DONE" -eq 1 ]]; then
        return
    fi

    CLEANUP_DONE=1

    echo "Time Announcer: cleaning up..."

    # Stop caffeinate if we started it.
    if [[ -n "$CAFFEINATE_PID" ]]; then
        if kill -0 "$CAFFEINATE_PID" 2>/dev/null; then
            kill "$CAFFEINATE_PID" 2>/dev/null || true

            # Give it a moment to exit gracefully.
            for _ in {1..10}; do
                if ! kill -0 "$CAFFEINATE_PID" 2>/dev/null; then
                    break
                fi
                sleep 0.1
            done

            # Last resort.
            if kill -0 "$CAFFEINATE_PID" 2>/dev/null; then
                kill -9 "$CAFFEINATE_PID" 2>/dev/null || true
            fi
        fi
    fi

    # Only remove the lock if it belongs to us.
    if [[ -f "$PID_FILE" ]]; then
        LOCK_PID=$(cat "$PID_FILE" 2>/dev/null || true)

        if [[ "$LOCK_PID" == "$$" ]]; then
            rm -rf "$LOCK_DIR"
        fi
    fi

    echo "Time Announcer: stopped."
}


# ---------------------------------------------------------
# 1. Parse and validate interval BEFORE acquiring lock
# ---------------------------------------------------------

INTERVAL_INPUT="${1:-}"

if [[ -z "$INTERVAL_INPUT" ]]; then
    echo "Usage: $0 <interval>"
    echo "Examples: 30s, 5m, 30m, 1h"
    exit 1
fi

UNIT="${INTERVAL_INPUT: -1}"
VALUE="${INTERVAL_INPUT%?}"

# Remove leading zeroes.
VALUE="${VALUE#"${VALUE%%[!0]*}"}"
VALUE="${VALUE:-0}"

if ! [[ "$VALUE" =~ ^[0-9]+$ ]] || [[ "$VALUE" -le 0 ]]; then
    echo "Error: Invalid interval '$INTERVAL_INPUT'."
    exit 1
fi

case "$UNIT" in
    s|S)
        INTERVAL="$VALUE"
        ;;

    m|M)
        INTERVAL=$((10#$VALUE * 60))
        ;;

    h|H)
        INTERVAL=$((10#$VALUE * 3600))
        ;;

    *)
        echo "Error: Invalid unit '$UNIT'."
        echo "Use s, m, or h."
        exit 1
        ;;
esac


# ---------------------------------------------------------
# 2. Acquire single-instance lock
# ---------------------------------------------------------

if ! mkdir "$LOCK_DIR" 2>/dev/null; then

    if [[ -f "$PID_FILE" ]]; then
        OLD_PID=$(cat "$PID_FILE" 2>/dev/null || true)

        if [[ "$OLD_PID" =~ ^[0-9]+$ ]] &&
           kill -0 "$OLD_PID" 2>/dev/null; then

            # Verify that the PID actually belongs to our script.
            PROCESS_COMMAND=$(ps -p "$OLD_PID" -o command= 2>/dev/null || true)

            if [[ "$PROCESS_COMMAND" == *"chronos.sh"* ]]; then
                echo "Time Announcer is already running (PID $OLD_PID)."
                exit 0
            fi
        fi
    fi

    # Lock exists but its process is no longer valid.
    rm -rf "$LOCK_DIR"

    if ! mkdir "$LOCK_DIR" 2>/dev/null; then
        echo "Error: Could not acquire Time Announcer lock."
        exit 1
    fi
fi


# ---------------------------------------------------------
# 3. Write our PID
# ---------------------------------------------------------

echo "$$" > "$PID_FILE"


# ---------------------------------------------------------
# 4. Install cleanup traps
# ---------------------------------------------------------

stop() {
    cleanup
    exit 0
}

trap cleanup EXIT
trap stop INT TERM HUP


# ---------------------------------------------------------
# 5. Start caffeinate
# ---------------------------------------------------------

echo "Time Announcer started."
echo "Interval: $INTERVAL_INPUT ($INTERVAL seconds)"

caffeinate -i -s -d -w $$ &
CAFFEINATE_PID=$!


# ---------------------------------------------------------
# 6. Announcement loop
# ---------------------------------------------------------

while true; do

    HOUR=$(date "+%-I")
    MINUTE=$(date "+%-M")
    AMPM=$(date "+%p")

    NUM_MINUTE=$((10#$MINUTE))

    if [[ "$NUM_MINUTE" -eq 0 ]]; then
        MESSAGE="The time is $HOUR o'clock $AMPM"

    elif [[ "$NUM_MINUTE" -lt 10 ]]; then
        MESSAGE="The time is $HOUR oh $MINUTE $AMPM"

    else
        MESSAGE="The time is $HOUR $MINUTE $AMPM"
    fi

    echo "$(date '+%H:%M:%S') → $MESSAGE"

    say "$MESSAGE"

    sleep "$INTERVAL"

done