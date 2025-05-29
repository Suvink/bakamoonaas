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

import { STORAGE_KEYS } from './constants.js';

// Storage utilities for managing schedules and completed downloads
export class StorageManager {
    
    // Get schedules from storage
    static async getSchedules() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.SCHEDULES);
            return result[STORAGE_KEYS.SCHEDULES] || [];
        } catch (error) {
            console.error('Error getting schedules:', error);
            return [];
        }
    }

    // Save schedules to storage
    static async setSchedules(schedules) {
        try {
            await chrome.storage.local.set({ [STORAGE_KEYS.SCHEDULES]: schedules });
            return true;
        } catch (error) {
            console.error('Error saving schedules:', error);
            return false;
        }
    }

    // Add a new schedule
    static async addSchedule(schedule) {
        const schedules = await this.getSchedules();
        schedules.push(schedule);
        return await this.setSchedules(schedules);
    }

    // Update an existing schedule
    static async updateSchedule(downloadId, updatedSchedule) {
        const schedules = await this.getSchedules();
        const index = schedules.findIndex(s => s.id === downloadId);
        
        if (index >= 0) {
            schedules[index] = updatedSchedule;
        } else {
            schedules.push(updatedSchedule);
        }
        
        return await this.setSchedules(schedules);
    }

    // Remove a schedule
    static async removeSchedule(downloadId) {
        const schedules = await this.getSchedules();
        const updatedSchedules = schedules.filter(s => s.id !== downloadId);
        return await this.setSchedules(updatedSchedules);
    }

    // Get completed downloads from storage
    static async getCompletedDownloads() {
        try {
            const result = await chrome.storage.local.get(STORAGE_KEYS.COMPLETED_DOWNLOADS);
            return result[STORAGE_KEYS.COMPLETED_DOWNLOADS] || [];
        } catch (error) {
            console.error('Error getting completed downloads:', error);
            return [];
        }
    }

    // Save completed downloads to storage
    static async setCompletedDownloads(completedDownloads) {
        try {
            await chrome.storage.local.set({ [STORAGE_KEYS.COMPLETED_DOWNLOADS]: completedDownloads });
            return true;
        } catch (error) {
            console.error('Error saving completed downloads:', error);
            return false;
        }
    }

    // Add a completed download
    static async addCompletedDownload(download) {
        const completedDownloads = await this.getCompletedDownloads();
        const completedDownload = {
            id: download.id,
            filename: download.filename,
            completedAt: Date.now(),
        };
        completedDownloads.push(completedDownload);
        return await this.setCompletedDownloads(completedDownloads);
    }

    // Clean up old completed downloads
    static async cleanupOldCompletedDownloads(retentionPeriod) {
        const completedDownloads = await this.getCompletedDownloads();
        const now = Date.now();
        
        const filteredDownloads = completedDownloads.filter(item => {
            return now - item.completedAt < retentionPeriod;
        });

        if (filteredDownloads.length !== completedDownloads.length) {
            await this.setCompletedDownloads(filteredDownloads);
            return completedDownloads.length - filteredDownloads.length; // Return count of cleaned items
        }
        
        return 0;
    }

    // Get both schedules and completed downloads
    static async getAllData() {
        try {
            const result = await chrome.storage.local.get([
                STORAGE_KEYS.SCHEDULES,
                STORAGE_KEYS.COMPLETED_DOWNLOADS
            ]);
            
            return {
                schedules: result[STORAGE_KEYS.SCHEDULES] || [],
                completedDownloads: result[STORAGE_KEYS.COMPLETED_DOWNLOADS] || []
            };
        } catch (error) {
            console.error('Error getting all data:', error);
            return {
                schedules: [],
                completedDownloads: []
            };
        }
    }
}
