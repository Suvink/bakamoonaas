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

export function formatDateTime(dateTimeStr) {
    const date = new Date(dateTimeStr);
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function getCurrentDateTime() {
    return new Date().toISOString().slice(0, 16);
}

export function getDateTimeOneHourLater() {
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
    return oneHourLater.toISOString().slice(0, 16);
}

export function getFilename(path) {
    return path ? path.split("/").pop() : "Unknown file";
}

export function formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function calculateProgress(download) {
    if (!download.totalBytes || download.totalBytes === 0) {
        return 0;
    }
    return Math.round((download.bytesReceived / download.totalBytes) * 100);
}

export function isOldCompletedDownload(item, retentionPeriod) {
    const now = Date.now();
    return now - item.completedAt >= retentionPeriod;
}

export function createAlarmName(type, downloadId) {
    return `${type}-${downloadId}`;
}

export function parseAlarmName(alarmName) {
    const [type, downloadId] = alarmName.split("-");
    return { type, downloadId: parseInt(downloadId) };
}

export function removeDuplicatesById(array) {
    const seen = new Set();
    return array.filter(item => {
        if (seen.has(item.id)) {
            return false;
        }
        seen.add(item.id);
        return true;
    });
}

export function validateScheduleTimes(startTime, endTime) {
    if (!startTime || !endTime) {
        return { isValid: false, error: 'Both start and end times are required' };
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
        return { isValid: false, error: 'End time must be after start time' };
    }
    
    return { isValid: true };
}
