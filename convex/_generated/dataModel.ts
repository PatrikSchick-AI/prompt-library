/* eslint-disable */
/**
 * Generated data model types for Convex.
 * This file is auto-generated and should not be edited manually.
 */

export type Id<TableName extends string> = string & { __tableName: TableName };

export interface Doc {
  _id: Id<string>;
  _creationTime: number;
}

export interface DataModel {
  prompts: {
    _id: Id<"prompts">;
    _creationTime: number;
    name: string;
    description?: string;
    purpose: string;
    tags: string[];
    status: "draft" | "in_review" | "testing" | "active" | "deprecated" | "archived";
    owner?: string;
    current_version_id?: Id<"prompt_versions">;
    created_at: number;
    updated_at: number;
    search_text?: string;
  };
  prompt_versions: {
    _id: Id<"prompt_versions">;
    _creationTime: number;
    prompt_id: Id<"prompts">;
    version_number: string;
    change_description: string;
    content: string;
    system_prompt?: string;
    models: string[];
    model_config: any;
    author?: string;
    created_at: number;
    previous_version_id?: Id<"prompt_versions">;
  };
  prompt_events: {
    _id: Id<"prompt_events">;
    _creationTime: number;
    prompt_id: Id<"prompts">;
    event_type: "created" | "version_created" | "status_changed" | "metadata_updated" | "rollback";
    comment?: string;
    metadata: any;
    created_at: number;
    created_by?: string;
  };
}

export type TableNames = keyof DataModel;
export type SystemDataModel = DataModel;
