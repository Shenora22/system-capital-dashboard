#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const workflowDir = new URL("../n8n/workflows/", import.meta.url);

function duplicateKeyPaths(jsonText) {
  const duplicates = [];
  let index = 0;

  function error(message) {
    throw new Error(`${message} at character ${index}`);
  }

  function skipWhitespace() {
    while (/\s/.test(jsonText[index] ?? "")) index += 1;
  }

  function parseString() {
    if (jsonText[index] !== '"') error("Expected string");
    index += 1;
    let value = "";

    while (index < jsonText.length) {
      const char = jsonText[index];
      if (char === '"') {
        index += 1;
        return value;
      }
      if (char === "\\") {
        const escape = jsonText[index + 1];
        if (!escape) error("Unterminated escape sequence");
        value += `\\${escape}`;
        index += escape === "u" ? 6 : 2;
        continue;
      }
      value += char;
      index += 1;
    }

    error("Unterminated string");
  }

  function parsePrimitive() {
    const start = index;
    while (index < jsonText.length && !/[\s,\]}]/.test(jsonText[index])) index += 1;
    if (start === index) error("Expected primitive value");
  }

  function parseArray(path) {
    index += 1;
    skipWhitespace();
    if (jsonText[index] === "]") {
      index += 1;
      return;
    }

    let itemIndex = 0;
    while (index < jsonText.length) {
      parseValue(`${path}[${itemIndex}]`);
      skipWhitespace();
      if (jsonText[index] === ",") {
        index += 1;
        itemIndex += 1;
        skipWhitespace();
        continue;
      }
      if (jsonText[index] === "]") {
        index += 1;
        return;
      }
      error("Expected comma or array end");
    }

    error("Unterminated array");
  }

  function parseObject(path) {
    index += 1;
    const keys = new Set();
    skipWhitespace();
    if (jsonText[index] === "}") {
      index += 1;
      return;
    }

    while (index < jsonText.length) {
      const key = parseString();
      const keyPath = path ? `${path}.${key}` : key;
      if (keys.has(key)) duplicates.push(keyPath);
      keys.add(key);
      skipWhitespace();
      if (jsonText[index] !== ":") error("Expected colon");
      index += 1;
      parseValue(keyPath);
      skipWhitespace();
      if (jsonText[index] === ",") {
        index += 1;
        skipWhitespace();
        continue;
      }
      if (jsonText[index] === "}") {
        index += 1;
        return;
      }
      error("Expected comma or object end");
    }

    error("Unterminated object");
  }

  function parseValue(path) {
    skipWhitespace();
    const char = jsonText[index];
    if (char === "{") return parseObject(path);
    if (char === "[") return parseArray(path);
    if (char === '"') return parseString();
    return parsePrimitive();
  }

  parseValue("$");
  skipWhitespace();
  if (index !== jsonText.length) error("Unexpected trailing content");
  return duplicates;
}

function nodeByName(workflow, nodeName) {
  return (workflow.nodes ?? []).find((node) => node.name === nodeName);
}

function assertRespondNodes(workflow, fileName) {
  const respondNodes = (workflow.nodes ?? []).filter((node) => node.type === "n8n-nodes-base.respondToWebhook");

  for (const node of respondNodes) {
    if (node.parameters?.respondWith !== "json") {
      throw new Error(`${fileName}: ${node.name} must use respondWith=json`);
    }

    let responseBody;
    try {
      responseBody = JSON.parse(node.parameters?.responseBody ?? "");
    } catch (error) {
      throw new Error(`${fileName}: ${node.name} responseBody is not valid JSON: ${error.message}`);
    }

    if (node.name === "Respond Success") {
      const expected = { success: true, message: "Lead captured successfully" };
      if (JSON.stringify(responseBody) !== JSON.stringify(expected)) {
        throw new Error(`${fileName}: Respond Success response body does not match required payload`);
      }
    }
  }
}

function assertLeadWebhook(workflow, fileName) {
  if (workflow.name !== "System Capital - Lead Capture Production") return;

  const webhook = nodeByName(workflow, "Lead Capture Webhook");
  if (!webhook) throw new Error(`${fileName}: Lead Capture Webhook node missing`);
  if (webhook.parameters?.path !== "system-capital-lead") {
    throw new Error(`${fileName}: n8n webhook node path must be system-capital-lead for production /webhook/system-capital-lead URL`);
  }
  if (webhook.parameters?.responseMode !== "responseNode") {
    throw new Error(`${fileName}: Lead Capture Webhook must use responseMode=responseNode`);
  }
}

function assertSkyTraceAlertWorkflow(workflow, fileName) {
  if (workflow.name !== "SC - SkyTrace Telegram Alert") return;

  const trigger = nodeByName(workflow, "SkyTrace Event Inserted");
  if (!trigger) throw new Error(`${fileName}: SkyTrace Event Inserted trigger missing`);
  if (trigger.type !== "n8n-nodes-base.postgresTrigger") {
    throw new Error(`${fileName}: SkyTrace Event Inserted must be a Postgres Trigger node`);
  }
  if (trigger.parameters?.schema !== "public") {
    throw new Error(`${fileName}: SkyTrace trigger schema must be public`);
  }
  if (trigger.parameters?.table !== "skytrace_events" && trigger.parameters?.tableName !== "skytrace_events") {
    throw new Error(`${fileName}: SkyTrace trigger table must be skytrace_events`);
  }
  const events = trigger.parameters?.events ?? [trigger.parameters?.firesOn].filter(Boolean);
  if (!events.includes("INSERT")) {
    throw new Error(`${fileName}: SkyTrace trigger must listen for INSERT events`);
  }

  const readInsertedRow = nodeByName(workflow, "Read Inserted Row");
  if (!readInsertedRow?.parameters?.jsCode?.includes("skytrace_alert_eligible")) {
    throw new Error(`${fileName}: Read Inserted Row must compute skytrace_alert_eligible`);
  }

  const condition = nodeByName(workflow, "Requires Approval Or Critical?");
  if (!condition) throw new Error(`${fileName}: eligibility condition node missing`);

  const formatter = nodeByName(workflow, "Format Operational Alert");
  if (!formatter?.parameters?.jsCode?.includes("SkyTrace Operational Alert")) {
    throw new Error(`${fileName}: Format Operational Alert must build the Telegram message`);
  }

  const telegram = nodeByName(workflow, "Send SkyTrace Telegram Alert");
  if (!telegram) throw new Error(`${fileName}: Telegram alert node missing`);
  if (telegram.type !== "n8n-nodes-base.telegram") {
    throw new Error(`${fileName}: Send SkyTrace Telegram Alert must be a Telegram node`);
  }
  if (!String(telegram.parameters?.chatId ?? "").includes("SKYTRACE_ALERT_CHAT_ID")) {
    throw new Error(`${fileName}: Telegram chatId must use SKYTRACE_ALERT_CHAT_ID`);
  }

  const deliveryLog = nodeByName(workflow, "Log Notification Delivery Result");
  if (!deliveryLog?.parameters?.jsCode?.includes("[SKYTRACE_TELEGRAM_DELIVERY]")) {
    throw new Error(`${fileName}: delivery log node must emit SKYTRACE_TELEGRAM_DELIVERY`);
  }

  const deliveryStatus = nodeByName(workflow, "Return Delivery Status");
  if (!deliveryStatus?.parameters?.jsCode?.includes("delivery_status")) {
    throw new Error(`${fileName}: Return Delivery Status node missing delivery_status output`);
  }
}

function assertWorkflowShape(workflow, fileName) {
  if (!Array.isArray(workflow.nodes)) throw new Error(`${fileName}: nodes must be an array`);
  if (!workflow.connections || typeof workflow.connections !== "object") throw new Error(`${fileName}: connections object missing`);

  const nodeIds = new Set();
  for (const node of workflow.nodes) {
    for (const key of ["id", "name", "type", "typeVersion", "position", "parameters"]) {
      if (!(key in node)) throw new Error(`${fileName}: node ${node.name ?? node.id ?? "<unknown>"} missing ${key}`);
    }
    if (nodeIds.has(node.id)) throw new Error(`${fileName}: duplicate node id ${node.id}`);
    nodeIds.add(node.id);
  }

  assertRespondNodes(workflow, fileName);
  assertLeadWebhook(workflow, fileName);
  assertSkyTraceAlertWorkflow(workflow, fileName);
}

let checked = 0;
for (const fileName of readdirSync(workflowDir).filter((file) => file.endsWith(".json")).sort()) {
  const filePath = join(workflowDir.pathname, fileName);
  const raw = readFileSync(filePath, "utf8");
  const duplicates = duplicateKeyPaths(raw);
  if (duplicates.length) {
    throw new Error(`${fileName}: duplicate JSON keys found: ${duplicates.join(", ")}`);
  }

  const workflow = JSON.parse(raw);
  assertWorkflowShape(workflow, fileName);
  checked += 1;
}

console.log(`Validated ${checked} n8n workflow JSON file(s) with no duplicate keys.`);
