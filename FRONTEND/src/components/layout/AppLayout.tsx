import '../../styles-background-live.css';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAppPath } from '../../router/appRouter';

export default function AppLayout({ children }: { children: ReactNode }) {
  const path = useAppPath();
  return <div className={`app-shell ${path === '/github' ? 'github-shell' : ''}`}><div className="ambient" aria-hidden="true">
      <div className="ambient-light-sweep" />
      <div className="ambient-orbital orbital-a"/><div className="ambient-orbital orbital-b"/><div className="ambient-orbital orbital-c"/>
      <div className="ambient-orbit-ring ring-a"/><div className="ambient-orbit-ring ring-b"/><div className="ambient-orbit-ring ring-c"/>
      <div className="ambient-shape ambient-purple"/><div className="ambient-shape ambient-blue-small"/><div className="ambient-shape ambient-blue-big"/><div className="ambient-shape ambient-lilac"/>
      <div className="ambient-blob blob-a"/><div className="ambient-blob blob-b"/><div className="ambient-blob blob-c"/>
      <div className="ambient-particle p1"/><div className="ambient-particle p2"/><div className="ambient-particle p3"/><div className="ambient-particle p4"/><div className="ambient-particle p5"/>
      <div className="ambient-particle p6"/><div className="ambient-particle p7"/><div className="ambient-particle p8"/><div className="ambient-particle p9"/><div className="ambient-particle p10"/><div className="ambient-particle p11"/><div className="ambient-particle p12"/><div className="ambient-particle p13"/><div className="ambient-particle p14"/><div className="ambient-particle p15"/>
      <div className="ambient-streak streak-a"/><div className="ambient-streak streak-b"/><div className="ambient-streak streak-c"/><div className="ambient-streak streak-d"/>
      <div className="ambient-spark spark-a"/><div className="ambient-spark spark-b"/><div className="ambient-spark spark-c"/><div className="ambient-spark spark-d"/>
    </div><Sidebar path={path}/>{children}</div>;
}
