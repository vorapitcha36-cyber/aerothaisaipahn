import { Bell, Building2, CheckCircle2, ClipboardCheck, FileText, GraduationCap, LayoutDashboard, MapPin, Menu, Search, ShieldCheck, Upload, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "./lib/api";

const menuItems = [
  [LayoutDashboard, "แดชบอร์ด"],
  [MapPin, "พื้นที่รับผิดชอบ"],
  [FileText, "แผนและการฝึกซ้อม"],
  [ClipboardCheck, "การประเมินความเสี่ยง"],
  [GraduationCap, "ข้อมูลการอบรม"],
  [Users, "ข้อมูลพนักงาน รปภ."],
  [FileText, "วิธีปฏิบัติงาน (WI)"],
  [ShieldCheck, "ผลการตรวจสอบ"]
] as const;

const centers = ["เชียงใหม่", "อุดรธานี", "นครราชสีมา", "พิษณุโลก", "สุราษฎร์ธานี", "หัวหิน", "ภูเก็ต", "หาดใหญ่", "แม่สอด"];
const modules = ["แผนเผชิญเหตุ CNS", "การฝึกซ้อมแผน", "การประเมินความเสี่ยง", "Security Awareness", "ประวัติ รปภ.", "วิธีปฏิบัติงาน (WI)", "ผลตรวจสอบมาตรฐาน"];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({ centers: 9, outstations: 23, pending: 224, overdue: 0, dueSoon: 0 });

  useEffect(() => { api.dashboard().then(setDashboardStats).catch(() => undefined); }, []);

  return <div className="app-shell">
    <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
      <div className="brand"><span className="brand-mark"><ShieldCheck size={22}/></span><div><strong>AEROTHAI</strong><small>SECURITY STANDARDS</small></div><button className="mobile-close" onClick={() => setSidebarOpen(false)}><X/></button></div>
      <div className="menu-label">ภาพรวมระบบ</div>
      <nav>{menuItems.map(([Icon,label], index) => <button key={label} onClick={() => { setActiveIndex(index); setSidebarOpen(false); }} className={index === activeIndex ? "nav-item active" : "nav-item"}><Icon size={20}/><span>{label}</span></button>)}</nav>
      <div className="internal-card"><ShieldCheck size={20}/><div><b>ระบบภายในองค์กร</b><small>จำกัดข้อมูลตามสิทธิ์ผู้ใช้งาน</small></div></div>
      <div className="profile"><span>ผด</span><div><b>ผู้ดูแลระบบ</b><small>สำนักงานใหญ่</small></div></div>
    </aside>
    {sidebarOpen && <button className="scrim" aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)}/>} 
    <main>
      <header className="topbar"><button className="menu-button" onClick={() => setSidebarOpen(true)}><Menu/></button><div><h1>{activeIndex === 0 ? "ภาพรวมมาตรฐานการรักษาความปลอดภัย" : menuItems[activeIndex][1]}</h1><p>ศูนย์ควบคุมการบินและหอควบคุมจราจรทางอากาศทุกภูมิภาค</p></div><div className="header-actions"><button className="icon-button" onClick={() => setNotificationOpen(true)} aria-label="การแจ้งเตือน"><Bell size={20}/><i>3</i></button><button className="primary" onClick={() => setModalOpen(true)}><Upload size={17}/>เพิ่มข้อมูล</button></div></header>
      <section className="content">{activeIndex === 0 ? <>
        <div className="workspace-banner"><ShieldCheck/><div><b>Production Data Workspace</b><span>ระบบฐานข้อมูลถาวร · แสดงเฉพาะข้อมูลและเอกสารที่ผู้มีสิทธิ์บันทึกจริง</span></div><a>ดูประวัติการเปลี่ยนแปลง</a></div>
        <div className="security-banner"><ShieldCheck/><div><b>Information Security Controls</b><span>แดชบอร์ดและเอกสารถูกป้องกันด้วยการยืนยันตัวตนและการจำกัดสิทธิ์</span></div><div className="pills"><em>Google Authentication</em><em>Role-Based Access</em><em>Private Object Storage</em></div></div>
        <div className="stats"><Stat icon={<Building2/>} label="ศูนย์หลัก" value={String(dashboardStats.centers)} detail="ศูนย์ควบคุมการบิน"/><Stat icon={<MapPin/>} label="หอควบคุมย่อย" value={String(dashboardStats.outstations)} detail="พื้นที่ในความรับผิดชอบ"/><Stat icon={<FileText/>} label="รอดำเนินการ" value={String(dashboardStats.pending)} detail="พื้นที่ × 7 หัวข้อ" tone="amber"/><Stat icon={<ShieldCheck/>} label="เกินกำหนด" value={String(dashboardStats.overdue)} detail={dashboardStats.overdue ? "ต้องดำเนินการทบทวน" : "ยังไม่มีข้อมูลเกินกำหนด"} tone="red"/></div>
        <div className="filters"><input aria-label="ค้นหา" placeholder="ค้นหาศูนย์ควบคุมการบิน..."/><select><option>ทุกภูมิภาค</option></select><select><option>ทุกสถานะ</option></select></div>
        <div className="dashboard-grid"><div className="panel"><div className="panel-title"><b>แผนที่ศูนย์ควบคุมการบินและหอควบคุม</b><span>หมุดใหญ่: ศูนย์หลัก · หมุดวงกลม: หอควบคุมย่อย</span></div><ThailandMap/></div><div className="panel"><div className="panel-title"><b>ศูนย์และหอควบคุมในความรับผิดชอบ</b><span>9 ศูนย์หลัก · 23 หอควบคุมย่อย</span></div><div className="center-list">{centers.slice(0,6).map((name,i)=><div className={i===1?"center-row selected":"center-row"} key={name}><span><Building2/></span><div><b>ศูนย์ควบคุมการบิน{name}</b><small>ภาค{ i<2?"เหนือ":"ตะวันออกเฉียงเหนือ"} · หอควบคุม {i+1} แห่ง</small></div><em>รอดำเนินการ</em></div>)}</div></div></div>
        <div className="coverage panel"><div className="coverage-head"><div><span className="eyebrow">รายละเอียดพื้นที่ที่เลือก</span><h2>ศูนย์ควบคุมการบินพิษณุโลก</h2><p>ศูนย์หลักและหอควบคุมในความรับผิดชอบ 5 แห่ง</p></div><em>● รอดำเนินการ</em></div><div className="tabs"><button className="active">ศูนย์หลัก</button><button>สุโขทัย</button><button>เพชรบูรณ์</button><button>น่าน</button><button>แพร่</button><button>แม่สอด</button></div><div className="module-grid">{modules.map((m,i)=><article key={m}><span className={i===4?"module-icon red":"module-icon"}><FileText/></span><div><b>{m}</b><small>บันทึกข้อมูล · เอกสารหลักฐาน</small><em>รอดำเนินการ</em></div><button onClick={() => setActiveIndex(Math.min(i + 2, 7))}>เอกสาร</button></article>)}</div></div>
      </> : activeIndex === 1 ? <LocationsView/> : <RegistryView title={menuItems[activeIndex][1]} onAdd={() => setModalOpen(true)}/>}</section>
    </main>
    {modalOpen && <AddModal onClose={() => setModalOpen(false)}/>} 
    {notificationOpen && <NotificationsDrawer onClose={() => setNotificationOpen(false)}/>} 
  </div>;
}

function Stat({icon,label,value,detail,tone=""}:{icon:React.ReactNode;label:string;value:string;detail:string;tone?:string}) { return <article className={`stat ${tone}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article> }

function ThailandMap(){return <div className="map-wrap"><svg viewBox="0 0 360 500" role="img" aria-label="แผนที่ประเทศไทยแบบย่อ"><path d="M156 18l38 19 9 39-20 37 25 43-4 53 29 38-9 48-32 33-14 42 19 35-6 77-25 40-21-44 8-69-22-42 5-66-23-38 12-58-21-45 24-47-7-48 36-38z" fill="#dfe9e7" stroke="#c4d6d2" strokeWidth="3"/></svg>{centers.map((name,i)=><span key={name} className="map-pin" style={{left:`${30+(i%3)*18}%`,top:`${10+i*9}%`}}><MapPin size={13}/><b>{name}</b></span>)}<small>แผนที่เชิงสัญลักษณ์สำหรับแสดงพื้นที่รับผิดชอบ</small></div>}

function AddModal({onClose}:{onClose:()=>void}) {
  const today = new Date().toISOString().slice(0,10);
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear()+1)).toISOString().slice(0,10);
  const [locations,setLocations] = useState<Array<{id:string;nameTh:string}>>([]);
  const [categories,setCategories] = useState<Array<{id:string;nameTh:string}>>([]);
  const [form,setForm] = useState({locationId:"",categoryId:"",performedAt:today,nextReviewAt:nextYear,referenceNo:"",note:""});
  const [file,setFile] = useState<File|null>(null);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  useEffect(()=>{Promise.all([api.locations(),api.categories()]).then(([locationRows,categoryRows])=>{setLocations(locationRows);setCategories(categoryRows);setForm(current=>({...current,locationId:current.locationId||locationRows[0]?.id||"",categoryId:current.categoryId||categoryRows[0]?.id||""}))}).catch(()=>setError("กรุณาเข้าสู่ระบบและตรวจสอบการเชื่อมต่อ API"))},[]);
  const update = (key:string,value:string) => setForm(current=>({...current,[key]:value}));
  const submit = async (event:React.FormEvent) => {
    event.preventDefault(); setError("");
    if(!form.locationId||!form.categoryId||!file){setError("กรุณาระบุพื้นที่ หมวดข้อมูล และไฟล์หลักฐาน");return}
    setSaving(true);
    try {
      const document = await api.createDocument(form);
      const version = document.versions[0];
      const intent = await api.createUploadIntent({versionId:version.id,originalName:file.name,mimeType:file.type,sizeBytes:file.size});
      const upload = await fetch(intent.uploadUrl,{method:"PUT",headers:{"content-type":file.type},body:file});
      if(!upload.ok) throw new Error("อัปโหลดไฟล์ไปยังพื้นที่กักกันไม่สำเร็จ");
      await api.completeUpload(intent.id);
      onClose();
    } catch (reason) { setError(reason instanceof Error?reason.message:"บันทึกข้อมูลไม่สำเร็จ"); }
    finally { setSaving(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form className="modal" role="dialog" aria-modal="true" aria-labelledby="add-title" onSubmit={submit}><button type="button" className="modal-x" onClick={onClose}><X/></button><span className="eyebrow">บันทึกหลักฐานมาตรฐาน</span><h2 id="add-title">เพิ่มข้อมูลใหม่</h2><label>พื้นที่<select value={form.locationId} onChange={event=>update("locationId",event.target.value)} required><option value="">เลือกพื้นที่</option>{locations.map(item=><option key={item.id} value={item.id}>{item.nameTh}</option>)}</select></label><label>หมวดข้อมูล<select value={form.categoryId} onChange={event=>update("categoryId",event.target.value)} required><option value="">เลือกหมวดข้อมูล</option>{categories.map(item=><option key={item.id} value={item.id}>{item.nameTh}</option>)}</select></label><div className="two-cols"><label>วันที่จัดทำ / ดำเนินการ<input type="date" value={form.performedAt} onChange={event=>update("performedAt",event.target.value)} required/></label><label>วันที่ทบทวนครั้งถัดไป<input type="date" value={form.nextReviewAt} onChange={event=>update("nextReviewAt",event.target.value)} required/></label></div><label>เลขที่เอกสาร<input value={form.referenceNo} onChange={event=>update("referenceNo",event.target.value)} placeholder="ระบุข้อมูลอ้างอิง"/></label><label>หมายเหตุ<input value={form.note} onChange={event=>update("note",event.target.value)} placeholder="รายละเอียดเพิ่มเติม"/></label><label className="upload-box"><Upload/><span><b>{file?.name||"แนบไฟล์หลักฐาน"}</b><small>PDF, DOCX หรือ XLSX · ไม่เกิน 25 MB</small></span><input type="file" accept=".pdf,.docx,.xlsx" onChange={event=>setFile(event.target.files?.[0]||null)} required/><i>เลือกไฟล์</i></label>{error&&<p className="form-error">{error}</p>}<footer><button type="button" onClick={onClose}>ยกเลิก</button><button type="submit" className="primary" disabled={saving}><FileText/>{saving?"กำลังบันทึก...":"บันทึกข้อมูล"}</button></footer></form></div>
}

const sampleDocuments = [
  { ref: "CNS-PLN-001", place: "ศูนย์ควบคุมการบินเชียงใหม่", updated: "28 ส.ค. 2569", review: "28 ส.ค. 2570", status: "ใช้งาน" },
  { ref: "CNS-PLN-002", place: "ศูนย์ควบคุมการบินพิษณุโลก", updated: "14 ส.ค. 2569", review: "14 ก.ย. 2569", status: "ใกล้ทบทวน" },
  { ref: "CNS-PLN-003", place: "ศูนย์ควบคุมการบินภูเก็ต", updated: "02 ส.ค. 2569", review: "—", status: "รอตรวจทาน" }
];

function RegistryView({title,onAdd}:{title:string;onAdd:()=>void}){const [query,setQuery]=useState("");const [documents,setDocuments]=useState(sampleDocuments);useEffect(()=>{api.documents().then(rows=>setDocuments(rows.map(row=>({ref:row.referenceNo||"ไม่มีเลขอ้างอิง",place:row.location.nameTh,updated:new Date(row.updatedAt).toLocaleDateString("th-TH"),review:new Date(row.nextReviewAt).toLocaleDateString("th-TH"),status:row.workflowStatus==="ACTIVE"?(row.lifecycleStatus==="DUE_SOON"?"ใกล้ทบทวน":row.lifecycleStatus==="OVERDUE"?"เกินกำหนด":"ใช้งาน"):row.workflowStatus==="PENDING_REVIEW"?"รอตรวจทาน":"ฉบับร่าง"})))).catch(()=>undefined)},[]);const rows=documents.filter(item=>`${item.ref}${item.place}`.includes(query));return <div className="registry-view"><div className="page-heading"><div><span className="eyebrow">ทะเบียนเอกสารมาตรฐาน</span><h2>{title}</h2><p>ค้นหา ตรวจสอบสถานะ และติดตามเวอร์ชันเอกสารจากทุกพื้นที่</p></div><button className="primary" onClick={onAdd}><Upload/>เพิ่มเอกสาร</button></div><div className="registry-toolbar"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="ค้นหาเลขที่เอกสารหรือพื้นที่"/></label><select><option>ทุกพื้นที่</option></select><select><option>ทุกสถานะ</option></select></div><div className="table-card"><table><thead><tr><th>เลขที่เอกสาร</th><th>พื้นที่</th><th>วันที่ปรับปรุง</th><th>วันทบทวน</th><th>สถานะ</th><th></th></tr></thead><tbody>{rows.map(row=><tr key={`${row.ref}-${row.place}`}><td><b>{row.ref}</b><small>เวอร์ชันล่าสุด</small></td><td>{row.place}</td><td>{row.updated}</td><td>{row.review}</td><td><span className={`status ${row.status==="ใช้งาน"?"active":row.status==="ใกล้ทบทวน"?"due":"pending"}`}>{row.status}</span></td><td><button className="table-action">ดูรายละเอียด</button></td></tr>)}</tbody></table></div></div>}

function LocationsView(){const [locations,setLocations]=useState(centers.map((name,index)=>({id:name,nameTh:`ศูนย์ควบคุมการบิน${name}`,type:"CENTER",region:index%2?"NORTH":"CENTRAL"})));useEffect(()=>{api.locations().then(setLocations).catch(()=>undefined)},[]);return <div className="registry-view"><div className="page-heading"><div><span className="eyebrow">ข้อมูลพื้นที่รับผิดชอบ</span><h2>ศูนย์หลักและหอควบคุมย่อย</h2><p>Admin สามารถเพิ่ม แก้ไขพิกัด หรือปิดใช้งานพื้นที่ได้</p></div><button className="primary"><MapPin/>เพิ่มพื้นที่</button></div><div className="location-cards">{locations.map((location,index)=><article key={location.id}><span><Building2/></span><div><b>{location.nameTh}</b><small>{location.region} · {location.type==="CENTER"?`หอควบคุมย่อย ${(index%4)+1} แห่ง`:"หอควบคุมย่อย"}</small></div><em>ใช้งาน</em></article>)}</div></div>}

function NotificationsDrawer({onClose}:{onClose:()=>void}){return <div className="drawer-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><aside className="notification-drawer"><header><div><span className="eyebrow">Notification Center</span><h2>การแจ้งเตือน</h2></div><button onClick={onClose}><X/></button></header>{["มีเอกสาร 2 รายการรอตรวจทาน","เอกสาร CNS-PLN-002 ใกล้ถึงวันทบทวน","อนุมัติผู้ใช้งานใหม่สำเร็จ"].map((text,index)=><article key={text}><span><CheckCircle2/></span><div><b>{text}</b><small>{index===0?"5 นาทีที่แล้ว":"วันนี้"}</small></div></article>)}</aside></div>}

export default App;
