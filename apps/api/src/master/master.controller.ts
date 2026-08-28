import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { LocationType, Region, Role } from "@prisma/client";
import { Roles } from "../common/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";

interface LocationInput { code: string; nameTh: string; type: LocationType; region: Region; latitude: number; longitude: number; parentId?: string; active?: boolean }
interface CategoryInput { code: string; nameTh: string; description?: string; sortOrder: number; active?: boolean }

@Controller()
export class MasterController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("locations")
  locations() { return this.prisma.location.findMany({ orderBy: [{ type: "asc" }, { nameTh: "asc" }], include: { _count: { select: { children: true } } } }); }

  @Post("locations")
  @Roles(Role.ADMIN)
  createLocation(@Body() body: LocationInput) { return this.prisma.location.create({ data: body }); }

  @Patch("locations/:id")
  @Roles(Role.ADMIN)
  updateLocation(@Param("id") id: string, @Body() body: Partial<LocationInput>) { return this.prisma.location.update({ where: { id }, data: body }); }

  @Get("categories")
  categories() { return this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } }); }

  @Post("categories")
  @Roles(Role.ADMIN)
  createCategory(@Body() body: CategoryInput) { return this.prisma.category.create({ data: body }); }

  @Patch("categories/:id")
  @Roles(Role.ADMIN)
  updateCategory(@Param("id") id: string, @Body() body: Partial<CategoryInput>) { return this.prisma.category.update({ where: { id }, data: body }); }
}
