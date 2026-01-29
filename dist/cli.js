#!/usr/bin/env node
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
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_1 = require("./index");
const program = new commander_1.Command();
program
    .name("ai-ci")
    .description("Generates CI/CD workflows from project analysis")
    .version("1.0.0")
    .option("-p, --preview", "Preview without writing")
    .option("--provider <provider>", "CI provider", "github")
    .option("--deploy <target>", "Deploy target (vercel, netlify, aws, docker)")
    .option("-d, --dir <path>", "Project directory", ".")
    .option("-o, --output <path>", "Output path")
    .action(async (opts) => {
    const spinner = (0, ora_1.default)("Scanning project...").start();
    try {
        const dir = path.resolve(opts.dir);
        const info = await (0, index_1.scanProject)(dir);
        if (info.files.length === 0) {
            spinner.warn("No project files found. Are you in the right directory?");
            process.exit(1);
        }
        spinner.text = `Found ${info.files.length} config files. Generating workflow...`;
        const workflow = await (0, index_1.generateWorkflow)(info, opts.provider, opts.deploy);
        const defaultOutput = opts.provider === "github"
            ? ".github/workflows/ci.yml"
            : "ci-workflow.yml";
        const outPath = path.resolve(opts.output || defaultOutput);
        if (opts.preview) {
            spinner.stop();
            console.log(`\n--- Generated ${opts.provider} workflow ---\n`);
            console.log(workflow);
            console.log("\n-----------------------------------------\n");
        }
        else {
            const outDir = path.dirname(outPath);
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }
            fs.writeFileSync(outPath, workflow + "\n");
            spinner.succeed(`Workflow written to ${outPath}`);
        }
    }
    catch (err) {
        spinner.fail(err.message);
        process.exit(1);
    }
});
program.parse();
