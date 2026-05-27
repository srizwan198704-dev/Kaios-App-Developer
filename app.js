document.addEventListener("DOMContentLoaded", () => {
    let maxLimit = 98;
    let minLimit = 20;
    let currentFocusIndex = 0;
    let batteryRef = null;
    let alarmActive = false;

    const focusableElements = document.querySelectorAll(".focusable");
    const alarmSound = document.getElementById("alarm-sound");

    // ১. Battery API — KaiOS 2.5 এ legacy + modern সব ফলব্যাক
    function initBattery() {
        if (navigator.battery) {
            // Firefox OS / পুরনো KaiOS legacy API
            batteryRef = navigator.battery;
            setupBatteryListeners(batteryRef);
            updateAllBatteryInfo(batteryRef);
        } else if (navigator.mozBattery) {
            // আরও পুরনো Firefox/KaiOS ফলব্যাক
            batteryRef = navigator.mozBattery;
            setupBatteryListeners(batteryRef);
            updateAllBatteryInfo(batteryRef);
        } else if ('getBattery' in navigator) {
            // Modern Promise-based API
            navigator.getBattery().then(function(battery) {
                batteryRef = battery;
                setupBatteryListeners(battery);
                updateAllBatteryInfo(battery);
            }).catch(function(err) {
                console.log("getBattery error: " + err);
                document.getElementById('charge-status').textContent = "API Error";
                document.getElementById('battery-pct').textContent = "ERR";
            });
        } else {
            document.getElementById('charge-status').textContent = "Not Supported";
            document.getElementById('battery-pct').textContent = "N/A";
        }
    }

    function setupBatteryListeners(battery) {
        battery.addEventListener('levelchange', function() {
            updateAllBatteryInfo(battery);
        });
        battery.addEventListener('chargingchange', function() {
            updateAllBatteryInfo(battery);
        });
        battery.addEventListener('chargingtimechange', function() {
            updateAllBatteryInfo(battery);
        });
        battery.addEventListener('dischargingtimechange', function() {
            updateAllBatteryInfo(battery);
        });
    }

    function updateAllBatteryInfo(battery) {
        updateLevelInfo(battery);
        updateChargeInfo(battery);
    }

    function updateLevelInfo(battery) {
        const level = Math.round(battery.level * 100);
        const pctEl = document.getElementById('battery-pct');
        pctEl.textContent = level + "%";

        // ব্যাটারি লেভেল অনুযায়ী রঙ পরিবর্তন
        if (level <= 20) {
            pctEl.style.color = "#ff1744"; // লাল — বিপজ্জনক কম
        } else if (level <= 40) {
            pctEl.style.color = "#ff9100"; // কমলা — সতর্কতা
        } else if (level >= maxLimit) {
            pctEl.style.color = "#ffea00"; // হলুদ — চার্জ বেশি
        } else {
            pctEl.style.color = "#00e676"; // সবুজ — স্বাভাবিক
        }

        checkAlarmLimits(level, battery.charging);
    }

    function updateChargeInfo(battery) {
        const statusEl = document.getElementById('charge-status');
        const timeEl = document.getElementById('time-left');

        if (battery.charging) {
            statusEl.textContent = "Charging";
            statusEl.style.color = "#00e676";

            if (battery.chargingTime !== Infinity && battery.chargingTime > 0) {
                let totalMins = Math.round(battery.chargingTime / 60);
                if (totalMins >= 60) {
                    let hrs = Math.floor(totalMins / 60);
                    let mins = totalMins % 60;
                    timeEl.textContent = hrs + "h " + mins + "m full";
                } else {
                    timeEl.textContent = totalMins + "m to full";
                }
            } else {
                timeEl.textContent = "Calculating...";
            }
        } else {
            statusEl.textContent = "Discharging";
            statusEl.style.color = "#ff1744";

            if (battery.dischargingTime !== Infinity && battery.dischargingTime > 0) {
                let totalMins = Math.round(battery.dischargingTime / 60);
                let hrs = Math.floor(totalMins / 60);
                let mins = totalMins % 60;
                timeEl.textContent = hrs + "h " + mins + "m left";
            } else {
                timeEl.textContent = "Unknown";
            }
        }
    }

    // রিয়েল-টাইম পোলিং — ইভেন্ট মিস হলে ব্যাকআপ হিসেবে প্রতি ৩০ সেকেন্ডে আপডেট
    setInterval(function() {
        if (batteryRef) {
            updateAllBatteryInfo(batteryRef);
        }
    }, 30000);

    initBattery();

    // ২. ফেক টেম্পারেচার — Web API তে সরাসরি ব্যাটারি টেম্পারেচার পাওয়া যায় না
    function updateFakeTemp() {
        let fakeTemp = Math.floor(Math.random() * (42 - 30 + 1)) + 30;
        const tempEl = document.getElementById('temp');
        tempEl.textContent = fakeTemp + "°C";

        if (fakeTemp >= 40) {
            tempEl.style.color = "#ff1744"; // লাল — অতিরিক্ত গরম
        } else if (fakeTemp >= 36) {
            tempEl.style.color = "#ff9100"; // কমলা — একটু গরম
        } else {
            tempEl.style.color = "#00e676"; // সবুজ — স্বাভাবিক
        }
    }
    updateFakeTemp();
    setInterval(updateFakeTemp, 10000);

    // ৩. অ্যালার্ম লজিক
    function checkAlarmLimits(level, isCharging) {
        if (isCharging && level >= maxLimit) {
            if (!alarmActive) playAlarm();
        } else if (!isCharging && level <= minLimit) {
            if (!alarmActive) playAlarm();
        } else {
            stopAlarm();
        }
    }

    function playAlarm() {
        alarmActive = true;
        alarmSound.play().catch(function(e) {
            console.log("Audio play error: " + e);
        });
    }

    function stopAlarm() {
        if (alarmActive) {
            alarmActive = false;
            alarmSound.pause();
            alarmSound.currentTime = 0;
        }
    }

    // ৪. KaiOS D-Pad নেভিগেশন
    function updateFocus() {
        focusableElements.forEach(function(el, index) {
            if (index === currentFocusIndex) {
                el.classList.add("nav-focus");
            } else {
                el.classList.remove("nav-focus");
            }
        });
    }
    updateFocus(); // প্রথম লোডে ফোকাস সেট

    window.addEventListener('keydown', function(e) {
        const activeEl = focusableElements[currentFocusIndex];

        switch(e.key) {
            case 'ArrowDown':
            case 'Down': // KaiOS 2.5 ফলব্যাক
                if (currentFocusIndex < focusableElements.length - 1) currentFocusIndex++;
                updateFocus();
                e.preventDefault();
                break;

            case 'ArrowUp':
            case 'Up':
                if (currentFocusIndex > 0) currentFocusIndex--;
                updateFocus();
                e.preventDefault();
                break;

            case 'ArrowLeft':
            case 'Left': // বাম কী দিয়ে লিমিট কমানো
                modifyLimit(activeEl, -1);
                e.preventDefault();
                break;

            case 'ArrowRight':
            case 'Right': // ডান কী দিয়ে লিমিট বাড়ানো
                modifyLimit(activeEl, 1);
                e.preventDefault();
                break;

            case 'Enter': // অ্যালার্ম বন্ধ
                stopAlarm();
                break;

            case 'Backspace': // সফটকি বাম (KaiOS)
            case 'F1':
                modifyLimit(activeEl, -1);
                e.preventDefault();
                break;

            case 'F2': // সফটকি ডান (KaiOS)
                modifyLimit(activeEl, 1);
                e.preventDefault();
                break;
        }
    });

    function modifyLimit(element, amount) {
        if (!element) return;
        const type = element.getAttribute('data-type');

        if (type === 'max') {
            maxLimit = Math.max(minLimit + 1, Math.min(100, maxLimit + amount));
            document.getElementById('max-val').textContent = maxLimit;
        } else if (type === 'min') {
            minLimit = Math.max(0, Math.min(maxLimit - 1, minLimit + amount));
            document.getElementById('min-val').textContent = minLimit;
        }

        // লিমিট পরিবর্তনের পরে সাথে সাথে রিচেক
        if (batteryRef) {
            const level = Math.round(batteryRef.level * 100);
            checkAlarmLimits(level, batteryRef.charging);
        }
    }
});
