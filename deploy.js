#!/usr/bin/env node

// Manual deployment script for Claude Bridge Function
// Creates and deploys the function to Appwrite project 68a4e3da0022f3e129d0

import { Client, Functions, Storage } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ID = '68a4e3da0022f3e129d0';
const FUNCTION_ID = 'claude-bridge';
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';

// You'll need to provide your API key
const API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY_HERE';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const functions = new Functions(client);
const storage = new Storage(client);

async function deployFunction() {
    try {
        console.log('🚀 Starting Claude Bridge Function deployment...');
        
        // Create or update function
        try {
            // Try to get existing function
            await functions.get(FUNCTION_ID);
            console.log('📝 Function exists, updating...');
            
            await functions.update(
                FUNCTION_ID,
                'Claude Bridge Function',
                'node-18.0',
                ['any'], // execute permissions
                [], // events
                '', // schedule
                30, // timeout
                true // enabled
            );
            
        } catch (error) {
            if (error.code === 404) {
                console.log('🆕 Creating new function...');
                
                await functions.create(
                    FUNCTION_ID,
                    'Claude Bridge Function',
                    'node-18.0',
                    ['any'], // execute permissions
                    [], // events
                    '', // schedule
                    30, // timeout
                    true // enabled
                );
            } else {
                throw error;
            }
        }
        
        // Create deployment archive
        console.log('📦 Creating deployment package...');
        
        // Read main.js content
        const mainJs = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
        const packageJson = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
        
        // Create a simple tar.gz equivalent by bundling files
        const deploymentData = {
            'main.js': mainJs,
            'package.json': packageJson
        };
        
        // For now, just display the deployment info
        console.log('✅ Function configuration ready!');
        console.log('');
        console.log('📋 Deployment Details:');
        console.log(`   Project ID: ${PROJECT_ID}`);
        console.log(`   Function ID: ${FUNCTION_ID}`);
        console.log(`   Runtime: node-18.0`);
        console.log(`   Timeout: 30 seconds`);
        console.log('');
        console.log('🔗 Function will be available at:');
        console.log(`   https://cloud.appwrite.io/v1/functions/${FUNCTION_ID}/executions`);
        console.log('');
        console.log('⚠️  Manual Steps Required:');
        console.log('1. Go to Appwrite Console > Functions');
        console.log('2. Create new function with ID: claude-bridge');
        console.log('3. Upload the main.js and package.json files');
        console.log('4. Set runtime to node-18.0');
        console.log('5. Add your APPWRITE_API_KEY environment variable');
        console.log('6. Deploy the function');
        
        return true;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        console.error('   Make sure your APPWRITE_API_KEY is set correctly');
        return false;
    }
}

// Run deployment
deployFunction().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Deployment script failed:', error);
    process.exit(1);
});