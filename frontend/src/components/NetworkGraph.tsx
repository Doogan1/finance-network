import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';
import financialNetworkService from '../services/financialNetworkService';
import { Node as APINode, Edge as APIEdge } from '../services/types';

interface Node extends SimulationNodeDatum {
  id: string;
  name: string;
  type: 'account' | 'expense' | 'income' | 'investment';
  balance?: number;
}

interface Link extends SimulationLinkDatum<Node> {
  source: string;
  target: string;
  value: number;
}

const NetworkGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

  // Fetch network data
  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [nodesData, edgesData] = await Promise.all([
        financialNetworkService.getNodes(),
        financialNetworkService.getEdges()
      ]);

      // Transform API data to D3 format
      const transformedNodes: Node[] = nodesData.map(node => ({
        id: (node.id ?? Math.random()).toString(), // Fallback for new nodes
        name: node.name,
        type: node.node_type,
        balance: node.balance
      }));

      const transformedLinks: Link[] = edgesData.map(edge => ({
        source: edge.source.toString(),
        target: edge.target.toString(),
        value: edge.weight
      }));

      setNodes(transformedNodes);
      setLinks(transformedLinks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchNetworkData();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchNetworkData, 30000);
    return () => clearInterval(interval);
  }, []);

  // D3 visualization setup and update
  useEffect(() => {
    if (!svgRef.current || loading || error || nodes.length === 0) return;

    const width = 800;
    const height = 600;

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

    simulationRef.current = simulation;

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
      .text(d => `${d.name}\n${d.balance ? '$' + d.balance.toLocaleString() : ''}`);

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
  }, [nodes, links, loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-white p-6 rounded-lg shadow">
        <div className="text-gray-600">Loading network data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-white p-6 rounded-lg shadow">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <svg ref={svgRef} className="w-full h-[600px] border border-gray-200 rounded"></svg>
    </div>
  );
};

export default NetworkGraph;