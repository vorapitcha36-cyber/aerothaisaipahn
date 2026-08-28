import { Injectable } from "@nestjs/common";
import { WorkflowStatus } from "@prisma/client";
import { calculateCoveragePending, getLifecycleStatus } from "@aerothai/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async summary() {
    const [locations, categories, activeDocs] = await Promise.all([
      this.prisma.location.findMany({ where: { active: true }, select: { id: true, type: true } }),
      this.prisma.category.findMany({ where: { active: true }, select: { id: true } }),
      this.prisma.documentRecord.findMany({ where: { workflowStatus: WorkflowStatus.ACTIVE }, select: { locationId: true, categoryId: true, nextReviewAt: true } })
    ]);
    const covered = new Set(activeDocs.map(item => `${item.locationId}:${item.categoryId}`));
    return {
      centers: locations.filter(item => item.type === "CENTER").length,
      outstations: locations.filter(item => item.type === "OUTSTATION").length,
      pending: calculateCoveragePending(locations.map(item => item.id), categories.map(item => item.id), covered),
      overdue: activeDocs.filter(item => getLifecycleStatus(item.nextReviewAt) === "OVERDUE").length,
      dueSoon: activeDocs.filter(item => getLifecycleStatus(item.nextReviewAt) === "DUE_SOON").length
    };
  }
  map() { return this.prisma.location.findMany({ where: { active: true }, include: { _count: { select: { children: true } } }, orderBy: [{ type: "asc" }, { nameTh: "asc" }] }); }
  async coverage(locationId?: string) {
    const locations = await this.prisma.location.findMany({ where: locationId ? { OR: [{ id: locationId }, { parentId: locationId }], active: true } : { active: true }, orderBy: [{ type: "asc" }, { nameTh: "asc" }] });
    const categories = await this.prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    const documents = await this.prisma.documentRecord.findMany({ where: { locationId: { in: locations.map(item => item.id) }, workflowStatus: WorkflowStatus.ACTIVE }, include: { category: true } });
    return locations.map(location => ({ location, cells: categories.map(category => { const document = documents.find(item => item.locationId === location.id && item.categoryId === category.id); return { category, document: document ? { ...document, lifecycleStatus: getLifecycleStatus(document.nextReviewAt) } : null }; }) }));
  }
}
