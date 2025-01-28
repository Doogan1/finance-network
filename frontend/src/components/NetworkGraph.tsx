import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import financialNetworkService from '../services/financialNetworkService';
import { Node as APINode, Edge as APIEdge } from '../services/types';

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  source: NetworkNode;
  target: NetworkNode;
  value: number;
}

interface NetworkGraphProps {
  pollInterval?: number;  // in milliseconds, undefined means no polling
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ pollInterval }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [nodesData, edgesData] = await Promise.all([
        financialNetworkService.getNodes(),
        financialNetworkService.getEdges()
      ]);

      const transformedNodes: NetworkNode[] = nodesData.map(node => ({
        id: node.id.toString(),
        name: node.name,
        type: node.node_type.toLowerCase(),
        balance: Number(node.balance),
        x: undefined,
        y: undefined
      }));

      const nodeMap = new Map(transformedNodes.map(node => [node.id, node]));

      const transformedLinks: NetworkLink[] = edgesData.map(edge => {
        const sourceNode = nodeMap.get(edge.source.toString());
        const targetNode = nodeMap.get(edge.target.toString());

        if (!sourceNode || !targetNode) {
          throw new Error(`Invalid edge: source or target node not found for edge ${edge.id}`);
        }

        return {
          source: sourceNode,
          target: targetNode,
          value: Number(edge.weight)
        };
      });

      setNodes(transformedNodes);
      setLinks(transformedLinks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch network data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    
    if (pollInterval) {
      const interval = setInterval(fetchNetworkData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval]);

  useEffect(() => {
    if (!svgRef.current || loading || error || nodes.length === 0) return;

    const width = 800;
    const height = 600;
    const margin = 50;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    const g = svg.append("g");

    const balanceExtent = d3.extent(nodes, d => d.balance) as [number, number];
    const nodeScale = d3.scaleSqrt()
      .domain(balanceExtent)
      .range([10, 30]);

    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<NetworkNode>().radius(d => nodeScale(d.balance) + 10))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));

    simulationRef.current = simulation;

    g.append("defs").selectAll("marker")
      .data(["end"])
      .join("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#999")
      .attr("d", "M0,-5L10,0L0,5");

    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value) / 100)
      .attr("marker-end", "url(#arrow)");

    const dragBehavior = d3.drag<Element, NetworkNode>()
      .on("start", (event: d3.D3DragEvent<Element, NetworkNode, NetworkNode>) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event: d3.D3DragEvent<Element, NetworkNode, NetworkNode>) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event: d3.D3DragEvent<Element, NetworkNode, NetworkNode>) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });

    const node = g.append("g")
      .selectAll<SVGGElement, NetworkNode>("g")
      .data(nodes)
      .join("g")
      .call(dragBehavior as any);

    node.append("circle")
      .attr("r", d => nodeScale(d.balance))
      .attr("fill", d => {
        switch(d.type) {
          case "income": return "#48bb78";
          case "account": return "#4299e1";
          case "expense": return "#f56565";
          default: return "#cbd5e0";
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node.append("title")
      .text(d => `${d.name}\nBalance: $${d.balance.toLocaleString()}`);

    node.append("text")
      .text(d => d.name)
      .attr("y", d => nodeScale(d.balance) + 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#4a5568")
      .attr("font-size", "12px")
      .attr("pointer-events", "none");

    const zoomButtons = svg.append("g")
      .attr("transform", "translate(20, 20)");

    zoomButtons.append("rect")
      .attr("width", 30)
      .attr("height", 30)
      .attr("fill", "#fff")
      .attr("stroke", "#ccc")
      .attr("rx", 5)
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition()
          .duration(500)
          .call(zoomBehavior.scaleBy, 1.5);
      });

    zoomButtons.append("text")
      .attr("x", 15)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .style("pointer-events", "none")
      .text("+");

    zoomButtons.append("rect")
      .attr("y", 40)
      .attr("width", 30)
      .attr("height", 30)
      .attr("fill", "#fff")
      .attr("stroke", "#ccc")
      .attr("rx", 5)
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition()
          .duration(500)
          .call(zoomBehavior.scaleBy, 0.75);
      });

    zoomButtons.append("text")
      .attr("x", 15)
      .attr("y", 60)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .style("pointer-events", "none")
      .text("−");

    zoomButtons.append("rect")
      .attr("y", 80)
      .attr("width", 30)
      .attr("height", 30)
      .attr("fill", "#fff")
      .attr("stroke", "#ccc")
      .attr("rx", 5)
      .style("cursor", "pointer")
      .on("click", () => {
        svg.transition()
          .duration(500)
          .call(zoomBehavior.transform, d3.zoomIdentity);
      });

    zoomButtons.append("text")
      .attr("x", 15)
      .attr("y", 100)
      .attr("text-anchor", "middle")
      .attr("fill", "#666")
      .style("pointer-events", "none")
      .text("⟲");

    simulation.on("tick", () => {
      nodes.forEach(node => {
        node.x = Math.max(margin, Math.min(width - margin, node.x ?? width / 2));
        node.y = Math.max(margin, Math.min(height - margin, node.y ?? height / 2));
      });

      link
        .attr("x1", d => d.source.x ?? 0)
        .attr("y1", d => d.source.y ?? 0)
        .attr("x2", d => d.target.x ?? 0)
        .attr("y2", d => d.target.y ?? 0);

      node
        .attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

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