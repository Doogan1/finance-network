import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

interface Node extends SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  balance?: number;
}

interface Link extends SimulationLinkDatum<Node> {
  source: string;
  target: string;
  value: number;
}

const NetworkGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    // Sample data
    const nodes: Node[] = [
      { id: "checking", name: "Checking Account", type: "account", balance: 5000 },
      { id: "savings", name: "Savings Account", type: "account", balance: 15000 },
      { id: "rent", name: "Rent", type: "expense" },
      { id: "salary", name: "Salary", type: "income" },
      { id: "investment", name: "Investment Fund", type: "investment", balance: 25000 }
    ];

    const links: Link[] = [
      { source: "salary", target: "checking", value: 4000 },
      { source: "checking", target: "savings", value: 1000 },
      { source: "checking", target: "rent", value: 2000 },
      { source: "savings", target: "investment", value: 5000 }
    ];

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value) / 10);

    // Create nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 20)
      .attr("fill", d => {
        switch(d.type) {
          case "account": return "#4299e1";
          case "expense": return "#f56565";
          case "income": return "#48bb78";
          case "investment": return "#9f7aea";
          default: return "#cbd5e0";
        }
      });

    node.append("title")
      .text(d => `${d.name}\n${d.balance ? '$' + d.balance : ''}`);

    node.append("text")
      .text(d => d.name.split(' ')[0])
      .attr("x", -15)
      .attr("y", 30)
      .attr("font-size", "10px");

    // Update positions
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <svg ref={svgRef} className="w-full h-[600px] border border-gray-200 rounded"></svg>
    </div>
  );
};

export default NetworkGraph;