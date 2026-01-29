export declare function scanProject(dir: string): Promise<{
    files: string[];
    contents: Record<string, string>;
}>;
export declare function generateWorkflow(projectInfo: {
    files: string[];
    contents: Record<string, string>;
}, provider: string, deployTarget?: string): Promise<string>;
