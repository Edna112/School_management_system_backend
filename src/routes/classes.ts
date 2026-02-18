import express from "express";
import { or, ilike, and, sql, eq, desc, getTableColumns } from "drizzle-orm";
import { db } from "../db";
import { classes, subjects, user } from "../db/schema";

const router = express.Router();

//get all classes with optional search, filtering and pagination.
router.get("/", async (req, res) => {
    try {
        const { search, subject, teacher, page = "1", limit = "10" } = req.query;
        const pageNum = Number(Array.isArray(page) ? page[0] : page);
        const limitNum = Number(Array.isArray(limit) ? limit[0] : limit);

        const currentPage = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;
        const limitPage = Number.isFinite(limitNum) && limitNum > 0 ? Math.floor(limitNum) : 10;

        const offset = (currentPage - 1) * limitPage;

        const filterConditions = [];

        //if a search query exist, filter it by class name OR invite code
        if (search) {
            const searchPattern = `%${String(search).replace(/[%_]/g, "\\$&")}%`;
            filterConditions.push(
                or(
                    ilike(classes.name, searchPattern),
                    ilike(classes.inviteCode, searchPattern)
                )
            );
        }

        //if a subject filter exist, filter it by subject name
        if (subject) {
            const subjectPattern = `%${String(subject).replace(/[%_]/g, "\\$&")}%`;
            filterConditions.push(ilike(subjects.name, subjectPattern));
        }

        //if a teacher filter exist, filter it by teacher (user) name
        if (teacher) {
            const teacherPattern = `%${String(teacher).replace(/[%_]/g, "\\$&")}%`;
            filterConditions.push(ilike(user.name, teacherPattern));
        }

        //combine all filters if they exist using the AND operator
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const classesList = await db
            .select({
                ...getTableColumns(classes),
                subject: { ...getTableColumns(subjects) },
                teacher: { ...getTableColumns(user) },
            })
            .from(classes)
            .leftJoin(subjects, eq(classes.subjectId, subjects.id))
            .leftJoin(user, eq(classes.teacherId, user.id))
            .where(whereClause)
            .orderBy(desc(classes.createdAt))
            .limit(limitPage)
            .offset(offset);

        res.status(200).json({
            data: classesList,
            pagination: {
                page: currentPage,
                limit: limitPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPage),
            },
        });
    } catch (e) {
        console.error(`Get/classes error: ${e}`);
        res.status(500).json({ error: "Failed to get classes" });
    }
});

router.post('/', async (req, res) => {
    try {
        const {name, teacherId, subjectId, capacity, description, status, bannerUrl, bannerCldPubId} = req.body;

        const[createdClass] = await db
            . insert(classes)
            .values({...req.body, inviteCode: Math.random().toString(36).substring(2, 9), schedules: []})
            .returning({id: classes.id});
            if(!createdClass) throw new Error("Failed to create class");
            res.status(201).json({data:createdClass});

            

    } catch(e) {
        console.error(`POST/classes error: ${e}`);
        res.status(500).json({ error: e });
    }
    
});

export default router;