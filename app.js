document.addEventListener("DOMContentLoaded", () => {
    let maxLimit = 98;
    let minLimit = 20;
    let currentFocusIndex = 0;
    
    const focusableElements = document.querySelectorAll(".focusable");
    const alarmSound = document.getElementById("alarm-sound");

    // ১. ব্যাটারী ডেটা ট্র্যাকিং (Battery Status API)
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            function updateAllBatteryInfo() {
                updateLevelInfo();
                updateChargeInfo();
            }
            updateAllBatteryInfo();

            battery.addEventListener('levelchange', updateAllBatteryInfo);
            battery.addEventListener('chargingchange', updateAllBatteryInfo);
            battery.addEventListener('chargingtimechange', updateAllBatteryInfo);
            battery.addEventListener('dischargingtimechange', updateAllBatteryInfo);

            function updateLevelInfo() {
                const level = Math.round(battery.level * 100);
                document.getElementById('battery-pct').textContent = level + "%";
                checkAlarmLimits(level, battery.charging);
            }

            function updateChargeInfo() {
                if (battery.charging) {
                    document.getElementById('charge-status').textContent = "Charging";
                    document.getElementById('charge-status').style.color = "#00e676";
                    
                    if(battery.chargingTime !== Infinity) {
                        let mins = Math.round(battery.chargingTime / 60);
                        document.getElementById('time-left').textContent = mins + " mins to full";
                    } else {
                        document.getElementById('time-left').textContent = "Calculating...";
                    }
                } else {
                    document.getElementById('charge-status').textContent = "Discharging";
                    document.getElementById('charge-status').style.color = "#ff1744";
                    
                    if(battery.dischargingTime !== Infinity) {
                        let hours = (battery.dischargingTime / 3600).toFixed(1);
                        document.getElementById('time-left').textContent = hours + " hrs left";
                    } else {
                        document.getElementById('time-left').textContent = "Unknown";
                    }
                }
            }
        });
    } else {
        document.getElementById('charge-status').textContent = "API Not Supported";
    }

    // ফেক টেম্পারেচার জেনারেটর (যেহেতু বিশুদ্ধ ওয়েব API দিয়ে সরাসরি ব্যাটারি টেম্পারেচার পাওয়া যায় না)
    setInterval(() => {
        let fakeTemp = Math.floor(Math.random() * (39 - 34 + 1)) + 34;
        document.getElementById('temp').textContent = fakeTemp + "°C";
    }, 10000);

    // ২. অ্যালার্ম লজিক
    function checkAlarmLimits(level, isCharging) {
        if (isCharging && level >= maxLimit) {
            playAlarm();
        } else if (!isCharging && level <= minLimit) {
            playAlarm();
        } else {
            stopAlarm();
        }
    }

    function playAlarm() {
        alarmSound.play().catch(e => console.log("Audio play deferred"));
    }

    function stopAlarm() {
        alarmSound.pause();
        alarmSound.currentTime = 0;
    }

    // ৩. KaiOS কীপ্যাড নেভিগেশন (D-Pad কন্ট্রোল)
    function updateFocus() {
        focusableElements.forEach((el, index) => {
            if (index === currentFocusIndex) {
                el.classList.add("nav-focus");
            } else {
                el.classList.remove("nav-focus");
            }
        });
    }
    updateFocus(); // Initial focus

    window.addEventListener('keydown', (e) => {
        const activeEl = focusableElements[currentFocusIndex];
        
        switch(e.key) {
            case 'ArrowDown':
                if (currentFocusIndex < focusableElements.length - 1) currentFocusIndex++;
                updateFocus();
                break;
                
            case 'ArrowUp':
                if (currentFocusIndex > 0) currentFocusIndex--;
                updateFocus();
                break;
                
            case 'ArrowLeft': // বাম সফটকি বা লেফট কী দিয়ে ভ্যালু কমানো
                modifyLimit(activeEl, -1);
                break;
                
            case 'ArrowRight': // ডান সফটকি বা রাইট কী দিয়ে ভ্যালু বাড়ানো
                modifyLimit(activeEl, 1);
                break;
                
            case 'Enter': // অ্যালার্ম বন্ধ করার জন্য
                stopAlarm();
                break;
        }
    });

    function modifyLimit(element, amount) {
        const type = element.getAttribute('data-type');
        if (type === 'max') {
            maxLimit = Math.max(21, Math.min(100, maxLimit + amount));
            document.getElementById('max-val').textContent = maxLimit;
        } else if (type === 'min') {
            minLimit = Math.max(0, Math.min(maxLimit - 1, minLimit + amount));
            document.getElementById('min-val').textContent = minLimit;
        }
    }
});
