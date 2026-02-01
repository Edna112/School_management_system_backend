import express from "express";
import { or, ilike, and, sql, eq, desc, getTableColumns } from "drizzle-orm";
import { db } from "../db";
import { departments, subjects } from "../db/schema";

const router = express.Router();

//get all subjects with optional search, filtering and pagination.
router.get("/", async (req, res) => {
    try {
        const { search, department, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPage = Math.max(1, +limit);

        const offset = (currentPage - 1) * limitPage;

        const filterConditions = [];

        //if a search query exist, filter it by subject name OR subject code
        if (search) {
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.code, `%${search}%`)
                )
            )
        }
        
        //if a department is selected, filter it by department name
        if (department) {
            filterConditions.push(
                ilike(departments.name, `%${department}%`)
            )
        }

        //combine all filters if they exist using the AND operator
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

         const countResult = await db
         .select({count: sql<number>`count(*)`})
         .from(subjects)
         .leftJoin(departments, eq(subjects.departmentId, departments.id))
         .where(whereClause)

         const totalCount = countResult[0]?.count ?? 0;


         const subjectsList = await db.select({
            ...getTableColumns(subjects), 
            department: {...getTableColumns(departments)}}).from(subjects)
            .leftJoin(departments, eq(subjects.departmentId, departments.id))
            .where(whereClause)
            .orderBy(desc(subjects.createdAt))
            .limit(limitPage)
            .offset(offset);

            res.status(200).json({
                data: subjectsList,
                pagination: {
                    total: totalCount,
                    page: currentPage,
                    limit: limitPage,
                    totalPages: Math.ceil(totalCount / limitPage),
                }
            });



    } catch (e) {
        console.error(`Get/subject error: ${e}`);
        res.status(500).json({ error: "Failed to get subjects" });

    }


    

})

export default router;