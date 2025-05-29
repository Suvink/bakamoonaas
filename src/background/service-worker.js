/*
 * Copyright (c) 2025 Suvin Kodituwakku
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

chrome.runtime.onInstalled.addListener(() => {
    console.log("Background script initialized");

    // Check download status periodically
    chrome.alarms.create("checkDownloads", { periodInMinutes: 1 });

    // Clean up old completed downloads
    chrome.alarms.create("cleanupCompletedDownloads", { periodInMinutes: 60 });
});

// Check if any scheduled downloads need to be started or paused
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "checkDownloads") {
        checkScheduledDownloads();
        return;
    }

    if (alarm.name === "cleanupCompletedDownloads") {
        cleanupOldCompletedDownloads();
        return;
    }

    const [type, downloadId] = alarm.name.split("-");
    const id = parseInt(downloadId);

    if (type === "start") {
        try {
            await chrome.downloads.resume(id);
            console.log(`Download ${id} resumed.`);
        } catch (error) {
            console.error(`Error resuming download ${id}:`, error);
        }
    } else if (type === "pause") {
        try {
            await chrome.downloads.pause(id);
            console.log(`Download ${id} paused.`);
        } catch (error) {
            console.error(`Error pausing download ${id}:`, error);
        }
    }
});

// Clean up completed downloads older than 24 hours
async function cleanupOldCompletedDownloads() {
    try {
        const { completedDownloads = [] } = await chrome.storage.local.get("completedDownloads");

        if (completedDownloads.length === 0) return;

        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        const filteredDownloads = completedDownloads.filter((item) => {
            return now - item.completedAt < oneDayMs;
        });

        if (filteredDownloads.length !== completedDownloads.length) {
            console.log(`Cleaned up ${completedDownloads.length - filteredDownloads.length} old completed downloads`);
            await chrome.storage.local.set({ completedDownloads: filteredDownloads });
        }
    } catch (error) {
        console.error("Error cleaning up completed downloads:", error);
    }
}

// Check all scheduled downloads
async function checkScheduledDownloads() {
    try {
        const { schedules = [] } = await chrome.storage.local.get("schedules");
        if (!schedules.length) return;

        const now = new Date().getTime();
        const allDownloads = await chrome.downloads.search({});

        schedules.forEach((schedule) => {
            const download = allDownloads.find((d) => d.id === schedule.id);
            if (!download) return;

            const startTime = new Date(schedule.startTime).getTime();
            const endTime = new Date(schedule.endTime).getTime();

            // If it's time to start the download and it's not already in progress
            if (now >= startTime && now < endTime && download.paused) {
                chrome.downloads.resume(download.id);
                console.log(`Download ${download.id} resumed by periodic check.`);
            }

            // If it's time to pause the download and it's in progress
            if (now >= endTime && !download.paused && download.state === "in_progress") {
                chrome.downloads.pause(download.id);
                console.log(`Download ${download.id} paused by periodic check.`);
            }
        });
    } catch (error) {
        console.error("Error checking scheduled downloads:", error);
    }
}

// When schedules are updated, recreate the alarms
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.schedules) {
        const schedules = changes.schedules.newValue || [];

        // First clear any existing alarms (except the periodic check)
        chrome.alarms.getAll((alarms) => {
            alarms.forEach((alarm) => {
                if (alarm.name !== "checkDownloads" && alarm.name !== "cleanupCompletedDownloads") {
                    chrome.alarms.clear(alarm.name);
                }
            });

            // Then create new alarms for each schedule
            schedules.forEach((schedule) => {
                const startAlarmName = `start-${schedule.id}`;
                const endAlarmName = `pause-${schedule.id}`;

                const startTime = new Date(schedule.startTime).getTime();
                const endTime = new Date(schedule.endTime).getTime();

                // Only create alarms for future times
                const now = Date.now();
                if (startTime > now) {
                    chrome.alarms.create(startAlarmName, { when: startTime });
                }
                if (endTime > now) {
                    chrome.alarms.create(endAlarmName, { when: endTime });
                }
            });
        });
    }
});

// Listen for download state changes
chrome.downloads.onChanged.addListener(async (delta) => {
    if (delta.state && delta.state.current === "complete") {
        await handleCompletedDownload(delta.id);
    }
});

// Handle completed download
async function handleCompletedDownload(downloadId) {
    try {
        const [download] = await chrome.downloads.search({ id: downloadId });
        if (!download) return;

        const { schedules = [], completedDownloads = [] } = await chrome.storage.local.get([
            "schedules",
            "completedDownloads",
        ]);
        const isScheduled = schedules.some((schedule) => schedule.id === downloadId);

        if (isScheduled) {
            // Send notification
            chrome.notifications.create(`download-${downloadId}`, {
                type: "basic",
                iconUrl: "bakamoona.png",
                title: "Download Complete",
                message: `${download.filename.split("/").pop()} has completed successfully!`,
            });

            // Add to completed downloads with timestamp
            const completedDownload = {
                id: download.id,
                filename: download.filename,
                completedAt: Date.now(),
            };

            completedDownloads.push(completedDownload);

            // Filter out this download from schedules
            const updatedSchedules = schedules.filter((schedule) => schedule.id !== downloadId);

            // Update storage
            await chrome.storage.local.set({
                completedDownloads: completedDownloads,
                schedules: updatedSchedules,
            });

            console.log(`Download ${downloadId} marked as completed and saved`);
        }
    } catch (error) {
        console.error("Error handling completed download:", error);
    }
}
