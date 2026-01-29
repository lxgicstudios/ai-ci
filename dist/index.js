"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanProject = scanProject;
exports.generateWorkflow = generateWorkflow;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CONFIG_FILES = [
    "package.json", "tsconfig.json", "next.config.js", "next.config.mjs",
    "vite.config.ts", "nuxt.config.ts", "Cargo.toml", "go.mod",
    "pyproject.toml", "requirements.txt", "Gemfile", "build.gradle", "pom.xml",
    "jest.config.js", "jest.config.ts", "vitest.config.ts", ".eslintrc.js",
    ".eslintrc.json", "prettier.config.js", "Makefile",
    "docker-compose.yml", "Dockerfile", "vercel.json", "netlify.toml",
    "fly.toml", "railway.json",
];
async function scanProject(dir) {
    const found = [];
    const contents = {};
    for (const f of CONFIG_FILES) {
        const full = path.join(dir, f);
        if (fs.existsSync(full)) {
            found.push(f);
            const stat = fs.statSync(full);
            if (stat.size < 5000) {
                contents[f] = fs.readFileSync(full, "utf-8");
            }
        }
    }
    return { files: found, contents };
}
async function generateWorkflow(projectInfo, provider, deployTarget) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OPENAI_API_KEY environment variable. Set it with: export OPENAI_API_KEY=sk-...");
    }
    const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
    const deployInstruction = deployTarget
        ? `Include a deployment step for ${deployTarget}. Use the standard ${deployTarget} GitHub Action or deployment method.`
        : "Don't include deployment steps, just CI (lint, test, build).";
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a CI/CD expert. Generate a ${provider === "github" ? "GitHub Actions" : provider} workflow YAML file. Output ONLY the YAML contents. No markdown code fences. Include proper caching, matrix testing if appropriate, and best practices. ${deployInstruction}`
            },
            {
                role: "user",
                content: `Project files: ${projectInfo.files.join(", ")}\n\nKey file contents:\n${Object.entries(projectInfo.contents).map(([k, v]) => `--- ${k} ---\n${v}`).join("\n\n")}`
            }
        ],
        temperature: 0.3,
    });
    return response.choices[0]?.message?.content?.trim() || "";
}
