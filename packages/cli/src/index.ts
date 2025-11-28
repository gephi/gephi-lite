import { command, number, option, optional, positional, run, string } from "cmd-ts";
import cors from "cors";
import express from "express";
import fs from "fs";
import Graph from "graphology";
import open from "open";

import pkg from "../package.json" with { type: "json" };
import { workspaceFromGraph } from "./workspace.ts";

const BASE_URL = "https://lite.gephi.org";

const cmd = command({
  name: "gephi-lite",
  description: "Easily open a local graph with gephi-lite.",
  version: pkg.version,
  args: {
    path: positional({
      type: optional(string),
      description: "Path to the graph file. If not provided, will attempt to read the file from stdin.",
      displayName: "path",
    }),
    port: option({
      type: number,
      defaultValue: () => 8000,
      long: "port",
      short: "p",
      defaultValueIsSerializable: true,
      description: "Port used to serve local graph data.",
    }),
  },
  handler: async (args) => {
    let data: string | undefined = undefined;

    if (args.path == undefined || args.path === "-") {
      // Reading from stdin
      if (process.stdin.isTTY) {
        console.error("Cannot read graph data from stdin!");
        process.exit(1);
      }

      data = fs.readFileSync(process.stdin.fd, "utf-8");
    } else {
      // Reading from file
      try {
        data = fs.readFileSync(args.path, "utf-8");
      } catch {
        console.error(`Cannot read graph data from ${args.path}!`);
        process.exit(1);
      }
    }

    let json = JSON.parse(data);
    let graph = Graph.from(json);
    let workspace = workspaceFromGraph(graph);

    const server = express();
    server.use(cors());

    server.get("/file.json", (_, res) => {
      res.json(workspace);
    });

    server.listen(args.port);

    const localFileUrl = `http://localhost:${args.port}/file.json`;
    const targetUrl = `${BASE_URL}?file=${encodeURIComponent(localFileUrl)}`;

    await open(targetUrl, { wait: true });
  },
});

run(cmd, process.argv.slice(2));
