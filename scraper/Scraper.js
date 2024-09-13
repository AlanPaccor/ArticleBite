"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var puppeteer_1 = require("puppeteer");
var express_1 = require("express");
var body_parser_1 = require("body-parser");
var cors_1 = require("cors");
var axios_1 = require("axios");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
// OpenAI API configuration
var openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    console.error("OpenAI API key is not set. Please check your .env file.");
    process.exit(1);
}
// Function to summarize text using OpenAI API
function summarizeText(text) {
    return __awaiter(this, void 0, void 0, function () {
        var openaiResponse, summary, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('Sending text to OpenAI API for summarization...');
                    return [4 /*yield*/, axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                            model: 'gpt-4',
                            messages: [
                                { role: "system", content: "You are a helpful assistant that summarizes text into a notecard format." },
                                { role: "user", content: "Summarize the following text into a notecard format. Use the following format: objective1={objective1}, objective2={objective2}, ..., answer1={answer1}, answer2={answer2}. Provide at least 3 objectives and answers, and don't forget to add the \"{}\":\n\n".concat(text) }
                            ],
                            max_tokens: 500,
                            temperature: 0.7
                        }, {
                            headers: {
                                'Authorization': "Bearer ".concat(openaiApiKey),
                                'Content-Type': 'application/json'
                            }
                        })];
                case 1:
                    openaiResponse = _a.sent();
                    summary = openaiResponse.data.choices[0].message.content;
                    console.log('Received response from OpenAI:', summary);
                    return [2 /*return*/, summary];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error summarizing text:', error_1.response ? error_1.response.data : error_1.message);
                    throw new Error('OpenAI API request failed');
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Scraping route
app.post('/scrape', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var url, browser, page, text, summarizedText, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = req.body.url;
                if (!url) {
                    console.log('URL is missing from the request.');
                    return [2 /*return*/, res.status(400).json({ error: 'URL is required' })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 8, , 9]);
                console.log('Launching Puppeteer...');
                return [4 /*yield*/, puppeteer_1.default.launch({
                        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Necessary for some environments like Docker
                    })];
            case 2:
                browser = _a.sent();
                return [4 /*yield*/, browser.newPage()];
            case 3:
                page = _a.sent();
                console.log("Navigating to URL: ".concat(url));
                return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle2' })];
            case 4:
                _a.sent();
                console.log('Extracting text content from the page...');
                return [4 /*yield*/, page.evaluate(function () { return document.body.innerText; })];
            case 5:
                text = _a.sent();
                console.log('Closing browser...');
                return [4 /*yield*/, browser.close()];
            case 6:
                _a.sent();
                console.log('Sending the extracted text to OpenAI for summarization...');
                return [4 /*yield*/, summarizeText(text)];
            case 7:
                summarizedText = _a.sent();
                console.log('Summarization complete, sending response...');
                res.json({ summarizedText: summarizedText });
                return [3 /*break*/, 9];
            case 8:
                error_2 = _a.sent();
                console.error('Error scraping or summarizing data:', error_2.message);
                res.status(500).json({ error: 'Failed to scrape and summarize data' });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
// Start the server
var PORT = process.env.PORT || 3001;
app.listen(PORT, function () {
    console.log("Server running on port ".concat(PORT));
});
