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
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Popup script initialized");

    // Get all container elements
    const scheduledContainer = document.getElementById("scheduled-container");
    const downloadsContainer = document.getElementById("downloads-container");
    const completedContainer = document.getElementById("completed-container");

    // Get all template elements
    const downloadTemplate = document.getElementById("download-template");
    const scheduledTemplate = document.getElementById("scheduled-template");
    const completedTemplate = document.getElementById("completed-template");
    const emptyMessageTemplate = document.getElementById("empty-message-template");

    // Store current data for updates
    let currentSchedules = [];
    let updateInterval = null;

    // Format date for display
    function formatDateTime(dateTimeStr) {
        const date = new Date(dateTimeStr);
        return date.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    // Get filename from full path
    function getFilename(path) {
        return path ? path.split("/").pop() : "Unknown file";
    }

    // Calculate download progress percentage
    function calculateProgress(download) {
        if (!download.totalBytes || download.totalBytes === 0) {
            return 0;
        }
        return Math.round((download.bytesReceived / download.totalBytes) * 100);
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    // Update progress for a specific download card
    function updateDownloadProgress(downloadCard, download) {
        const progressContainer = downloadCard.querySelector(".progress-container");
        const progressBar = downloadCard.querySelector(".progress-bar");
        const progressText = downloadCard.querySelector(".progress-text");
        const statusIndicator = downloadCard.querySelector(".download-status");

        if (download.state === "in_progress" && !download.paused) {
            // Show progress bar for active downloads
            progressContainer.classList.remove("is-hidden");
            const progress = calculateProgress(download);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}% (${formatFileSize(download.bytesReceived)} / ${formatFileSize(
                download.totalBytes
            )})`;
            statusIndicator.innerHTML = '<i class="fas fa-download"></i> Downloading';
            statusIndicator.className = "download-status downloading";
        } else if (download.paused) {
            // Show paused status
            progressContainer.classList.add("is-hidden");
            statusIndicator.innerHTML = '<i class="fas fa-pause"></i> Scheduled';
            statusIndicator.className = "download-status scheduled";
        } else if (download.state === "complete") {
            // Handle completed downloads
            progressContainer.classList.add("is-hidden");
            statusIndicator.innerHTML = '<i class="fas fa-check"></i> Completed';
            statusIndicator.className = "download-status completed";
        } else {
            // Hide progress bar for waiting downloads
            progressContainer.classList.add("is-hidden");
            statusIndicator.innerHTML = '<i class="fas fa-clock"></i> Waiting';
            statusIndicator.className = "download-status waiting";
        }
    }

    // Update progress for all scheduled downloads
    async function updateScheduledDownloadsProgress() {
        try {
            if (currentSchedules.length === 0) return;

            // Get current download states
            const scheduledIds = currentSchedules.map((s) => s.id);
            const pausedDownloads = await chrome.downloads.search({ paused: true });
            const inProgressDownloads = await chrome.downloads.search({ state: "in_progress" });
            const completedDownloads = await chrome.downloads.search({ state: "complete" });

            // Combine all downloads
            const allCurrentDownloads = [...pausedDownloads, ...inProgressDownloads, ...completedDownloads];

            // Update each scheduled download card
            const scheduledCards = scheduledContainer.querySelectorAll(".card");
            scheduledCards.forEach((card, index) => {
                const schedule = currentSchedules[index];
                if (!schedule) return;

                const download = allCurrentDownloads.find((d) => d.id === schedule.id);
                if (download) {
                    updateDownloadProgress(card, download);

                    // If download is completed, trigger a full refresh after a short delay
                    if (download.state === "complete") {
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    }
                }
            });
        } catch (error) {
            console.error("Error updating download progress:", error);
        }
    }

    // Start real-time updates
    function startProgressUpdates() {
        // Update every 2 seconds
        updateInterval = setInterval(updateScheduledDownloadsProgress, 2000);
    }

    // Stop real-time updates
    function stopProgressUpdates() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    // Clean up when popup is closed
    window.addEventListener("beforeunload", stopProgressUpdates);

    // Create empty message
    function createEmptyMessage(message) {
        const emptyElement = document.importNode(emptyMessageTemplate.content, true);
        emptyElement.querySelector(".empty-message").textContent = message;
        return emptyElement;
    }

    // Clean up completed downloads older than 24 hours
    function cleanupOldCompletedDownloads(completedList) {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        return completedList.filter((item) => {
            return now - item.completedAt < oneDayMs;
        });
    }

    // Show an error message
    function showErrorMessage(message) {
        downloadsContainer.innerHTML = "";
        scheduledContainer.innerHTML = "";
        completedContainer.innerHTML = "";

        const errorElement = document.createElement("div");
        errorElement.className = "empty-message";
        errorElement.textContent = message;

        scheduledContainer.appendChild(createEmptyMessage("No scheduled downloads."));
        downloadsContainer.appendChild(errorElement);
        completedContainer.appendChild(createEmptyMessage("No completed downloads."));
    }

    // Show default state for the sections
    scheduledContainer.appendChild(createEmptyMessage("Loading scheduled downloads..."));
    downloadsContainer.appendChild(createEmptyMessage("Loading downloads..."));
    completedContainer.appendChild(createEmptyMessage("Loading completed downloads..."));

    try {
        console.log("Starting to load downloads...");

        // Check if downloads API is accessible
        if (!chrome.downloads) {
            throw new Error("Downloads API not available. Please check extension permissions.");
        }

        // Get paused downloads first (this is important for the API to work correctly)
        let allDownloads;
        try {
            const pausedDownloads = await chrome.downloads.search({ paused: true });
            console.log("Paused downloads loaded:", pausedDownloads.length);

            // Get in-progress downloads separately
            const inProgressDownloads = await chrome.downloads.search({ state: "in_progress" });
            console.log("In-progress downloads loaded:", inProgressDownloads.length);

            // Combine both lists, avoiding duplicates
            allDownloads = [...pausedDownloads];
            inProgressDownloads.forEach((download) => {
                if (!allDownloads.find((d) => d.id === download.id)) {
                    allDownloads.push(download);
                }
            });

            console.log("Total downloads:", allDownloads.length);
        } catch (err) {
            console.error("Error searching downloads:", err);
            throw new Error(`Failed to search downloads: ${err.message}`);
        }

        // Clear loading messages
        scheduledContainer.innerHTML = "";
        downloadsContainer.innerHTML = "";
        completedContainer.innerHTML = "";

        // Get all scheduled downloads and completed downloads from storage
        let schedules = [],
            completedDownloads = [];
        try {
            const result = await chrome.storage.local.get(["schedules", "completedDownloads"]);
            schedules = result.schedules || [];
            completedDownloads = result.completedDownloads || [];
            console.log("Schedules loaded:", schedules.length);
            console.log("Completed downloads loaded:", completedDownloads.length);
        } catch (err) {
            console.error("Error getting storage data:", err);
            // Continue anyway with empty arrays
        }

        // Clean up old completed downloads
        const cleanedCompletedDownloads = cleanupOldCompletedDownloads(completedDownloads);
        if (cleanedCompletedDownloads.length !== completedDownloads.length) {
            console.log(
                `Removed ${completedDownloads.length - cleanedCompletedDownloads.length} old completed downloads`
            );
            await chrome.storage.local.set({ completedDownloads: cleanedCompletedDownloads }).catch((err) => {
                console.error("Error updating completed downloads:", err);
            });
        }

        // Get scheduled downloads (downloads with schedules, including active ones)
        const scheduledDownloads = allDownloads.filter(
            (download) => schedules.some((schedule) => schedule.id === download.id) && download.state !== "complete"
        );

        // Get paused downloads without schedules
        const unscheduledPausedDownloads = allDownloads.filter(
            (download) => download.paused && !schedules.some((schedule) => schedule.id === download.id)
        );

        console.log("Scheduled downloads:", scheduledDownloads.length);
        console.log("Unscheduled paused downloads:", unscheduledPausedDownloads.length);

        // Render completed downloads
        if (cleanedCompletedDownloads.length === 0) {
            completedContainer.appendChild(createEmptyMessage("No completed downloads."));
        } else {
            cleanedCompletedDownloads.forEach((item) => {
                const downloadElement = document.importNode(completedTemplate.content, true);
                downloadElement.querySelector(".download-name").textContent = getFilename(item.filename);
                completedContainer.appendChild(downloadElement);
            });
        }

        // Render scheduled downloads
        if (scheduledDownloads.length === 0) {
            scheduledContainer.appendChild(createEmptyMessage("No scheduled downloads."));
        } else {
            // Store schedules for real-time updates
            currentSchedules = schedules.filter((s) => scheduledDownloads.some((d) => d.id === s.id));

            scheduledDownloads.forEach((download) => {
                const schedule = schedules.find((s) => s.id === download.id);
                if (!schedule) return;

                const downloadElement = document.importNode(scheduledTemplate.content, true);
                const downloadItem = downloadElement.querySelector(".card");

                // Set download info
                downloadItem.querySelector(".download-name").textContent = getFilename(download.filename);
                downloadItem.querySelector(".start-time-display").textContent = formatDateTime(schedule.startTime);
                downloadItem.querySelector(".end-time-display").textContent = formatDateTime(schedule.endTime);

                // Handle progress bar for active downloads
                const progressContainer = downloadItem.querySelector(".progress-container");
                const progressBar = downloadItem.querySelector(".progress-bar");
                const progressText = downloadItem.querySelector(".progress-text");
                const statusIndicator = downloadItem.querySelector(".download-status");

                if (download.state === "in_progress" && !download.paused) {
                    // Show progress bar for active downloads
                    progressContainer.classList.remove("is-hidden");
                    const progress = calculateProgress(download);
                    progressBar.style.width = `${progress}%`;
                    progressText.textContent = `${progress}% (${formatFileSize(
                        download.bytesReceived
                    )} / ${formatFileSize(download.totalBytes)})`;
                    statusIndicator.innerHTML = '<i class="fas fa-download"></i> Downloading';
                    statusIndicator.className = "download-status downloading";
                } else if (download.paused) {
                    // Show paused status
                    progressContainer.classList.add("is-hidden");
                    statusIndicator.innerHTML = '<i class="fas fa-pause"></i> Scheduled';
                    statusIndicator.className = "download-status scheduled";
                } else {
                    // Hide progress bar for paused/waiting downloads
                    progressContainer.classList.add("is-hidden");
                    statusIndicator.innerHTML = '<i class="fas fa-clock"></i> Waiting';
                    statusIndicator.className = "download-status waiting";
                }

                // Setup date-time inputs for editing
                const datetimeInputs = downloadItem.querySelector(".datetime-inputs");
                const startTimeInput = downloadItem.querySelector(".start-time");
                const endTimeInput = downloadItem.querySelector(".end-time");
                startTimeInput.value = schedule.startTime;
                endTimeInput.value = schedule.endTime;

                // Setup edit button
                const editButton = downloadItem.querySelector(".edit-schedule");
                editButton.addEventListener("click", () => {
                    datetimeInputs.classList.toggle("is-hidden");
                    editButton.classList.toggle("is-hidden");
                });

                // Setup cancel button
                downloadItem.querySelector(".cancel-edit").addEventListener("click", () => {
                    datetimeInputs.classList.add("is-hidden");
                    editButton.classList.remove("is-hidden");
                });

                // Setup save button
                downloadItem.querySelector(".save-schedule").addEventListener("click", () => {
                    const newStartTime = startTimeInput.value;
                    const newEndTime = endTimeInput.value;

                    if (newStartTime && newEndTime) {
                        const updatedSchedule = {
                            id: download.id,
                            startTime: newStartTime,
                            endTime: newEndTime,
                        };

                        chrome.storage.local.get({ schedules: [] }, (result) => {
                            const currentSchedules = result.schedules;
                            const index = currentSchedules.findIndex((s) => s.id === download.id);

                            if (index >= 0) {
                                currentSchedules[index] = updatedSchedule;
                            } else {
                                currentSchedules.push(updatedSchedule);
                            }

                            chrome.storage.local.set({ schedules: currentSchedules }, () => {
                                // Refresh the popup
                                window.location.reload();
                            });
                        });
                    } else {
                        alert("Please set both start and end times.");
                    }
                });

                scheduledContainer.appendChild(downloadElement);
            });
        }

        // Render paused downloads
        if (unscheduledPausedDownloads.length === 0) {
            downloadsContainer.appendChild(createEmptyMessage("No paused downloads available."));
        } else {
            unscheduledPausedDownloads.forEach((download) => {
                // Create a new element from the template
                const downloadElement = document.importNode(downloadTemplate.content, true);
                const downloadItem = downloadElement.querySelector(".card");

                // Set download info
                downloadItem.querySelector(".download-name").textContent = getFilename(download.filename);

                // Set up schedule button toggle
                const scheduleButton = downloadItem.querySelector(".schedule-toggle");
                const datetimeInputs = downloadItem.querySelector(".datetime-inputs");

                scheduleButton.addEventListener("click", () => {
                    datetimeInputs.classList.toggle("is-hidden");
                    scheduleButton.classList.toggle("is-hidden");
                });

                // Setup cancel button
                downloadItem.querySelector(".cancel-schedule").addEventListener("click", () => {
                    datetimeInputs.classList.add("is-hidden");
                    scheduleButton.classList.remove("is-hidden");
                });

                const startTimeInput = downloadItem.querySelector(".start-time");
                const endTimeInput = downloadItem.querySelector(".end-time");

                // Set default values to current time plus 1 hour for end time
                const now = new Date();
                const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

                startTimeInput.value = now.toISOString().slice(0, 16);
                endTimeInput.value = oneHourLater.toISOString().slice(0, 16);

                // Add event listener for the save button
                downloadItem.querySelector(".save-schedule").addEventListener("click", () => {
                    const startTime = startTimeInput.value;
                    const endTime = endTimeInput.value;

                    if (startTime && endTime) {
                        const schedule = { id: download.id, startTime, endTime };

                        chrome.storage.local.get({ schedules: [] }, (result) => {
                            const schedules = result.schedules;
                            schedules.push(schedule);
                            chrome.storage.local.set({ schedules }, () => {
                                // Refresh the popup
                                window.location.reload();
                            });
                        });
                    } else {
                        alert("Please set both start and end times.");
                    }
                });

                downloadsContainer.appendChild(downloadElement);
            });
        }

        // Start real-time progress updates
        startProgressUpdates();
    } catch (error) {
        console.error("Detailed error loading downloads:", error);
        showErrorMessage(`Error: ${error.message}. Please check console for details.`);
    }
});
