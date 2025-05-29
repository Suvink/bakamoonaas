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


export const APP_CONFIG = {
    NAME: 'Bakamoonaas',
    VERSION: '0.10-beta',
    UPDATE_INTERVAL: 2000, // 2 seconds
    CLEANUP_INTERVAL: 60, // 60 minutes
    DOWNLOAD_CHECK_INTERVAL: 1, // 1 minute
    COMPLETED_DOWNLOADS_RETENTION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

export const STORAGE_KEYS = {
    SCHEDULES: 'schedules',
    COMPLETED_DOWNLOADS: 'completedDownloads',
};

export const ALARMS = {
    CHECK_DOWNLOADS: 'checkDownloads',
    CLEANUP_COMPLETED: 'cleanupCompletedDownloads',
    START_PREFIX: 'start',
    PAUSE_PREFIX: 'pause',
};

export const DOWNLOAD_STATES = {
    IN_PROGRESS: 'in_progress',
    COMPLETE: 'complete',
    PAUSED: 'paused',
};

export const MESSAGES = {
    NO_SCHEDULED: 'No scheduled downloads.',
    NO_PAUSED: 'No paused downloads available.',
    NO_COMPLETED: 'No completed downloads.',
    LOADING_SCHEDULED: 'Loading scheduled downloads...',
    LOADING_DOWNLOADS: 'Loading downloads...',
    LOADING_COMPLETED: 'Loading completed downloads...',
    DOWNLOAD_COMPLETE: 'Download Complete',
    SET_BOTH_TIMES: 'Please set both start and end times.',
    API_NOT_AVAILABLE: 'Downloads API not available. Please check extension permissions.',
};
