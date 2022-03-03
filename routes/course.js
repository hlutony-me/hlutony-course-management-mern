const express = require("express")
const onlyUnique = require("../helper/findUnique")
const { authenticate, authorizeAdmin } = require("../middleware/auth")
const Course = require("../model/course")
const Student = require("../model/student")
const router = express.Router()

//Get all courses
router.get("/", async (req, res) => {
	try {
		const courseCodes = await Course.find()
		console.log(courseCodes)
		if (courseCodes.length === 0) {
			return res.json([])
		}

		return res.json(courseCodes)
	} catch (error) {
		res.status(500).json(error.message)
	}
})

//Get all students in one course
router.get(
	"/list-students/:courseCode",
	authenticate,
	authorizeAdmin,
	async (req, res) => {
		const courseCode = req.params.courseCode
		try {
			//Find all course by code
			const courses = await Course.find({ courseCode })
			var courseIds = []
			console.log(courses)
			courses.forEach((course) => {
				console.log(course._id)
				courseIds.push(course._id)
			})
			// for (var course in courses) {
			// 	console.log(course._id)
			// 	courseIds.push(course._id)
			// }

			const students = await Student.find({
				"courses.course": { $in: courseIds }
			})

			var studentNames = []
			students.forEach((student) => {
				studentNames.push(student.fullName)
			})

			//Find all student id of the courses
			//const course

			res.json({ studentNames })
		} catch (error) {
			res.status(500).json(error.message)
		}
	}
)

// Code and name of all unique courses
router.get("/course-codes", authenticate, authorizeAdmin, async (req, res) => {
	try {
		console.log("!23")
		const courseCodes = await Course.find().distinct("courseCode")
		var courses = []
		var codeAndName = []
		for (const code of courseCodes) {
			const course = await Course.findOne({ courseCode: code })
			const courseInfo = {
				courseCode: course.courseCode,
				courseName: course.courseName
			}
			courses.push(courseInfo)
		}

		res.json(courses)
	} catch (err) {
		res.status(500).json(err.message)
	}
})

//Get one course by id
router.get("/:courseId", authenticate, async (req, res) => {
	const courseId = req.params.courseId
	try {
		const course = await Course.findById(courseId)
		return res.json(course)
	} catch (err) {
		res.status(500).json(err.message)
	}
})

//createa course
router.post("/", authenticate, authorizeAdmin, async (req, res) => {
	try {
		//Add course to course list
		const course = new Course(req.body)

		//Check if course exists
		const courseInDb = await Course.find({
			$and: [
				{ courseCode: course.courseCode },
				{ section: course.section },
				{ semester: course.semester }
			]
		})

		if (courseInDb != null && courseInDb.length != 0) {
			return res.status(400).json({ msg: "Course exists" })
		}

		const newCourse = await course.save()
		res.json(newCourse)
	} catch (err) {
		res.status(500).json(err.message)
	}
})

//Update course
router.put("/:courseId", authenticate, authorizeAdmin, async (req, res) => {
	try {
		const courseId = req.params.courseId

		//Check if course exists
		const courseDuplicated = await Course.find({
			$and: [
				{ courseCode: req.body.courseCode },
				{ section: req.body.section },
				{ semester: req.body.semester }
			]
		})

		if (courseDuplicated != null && courseDuplicated.length != 0) {
			return res.status(400).json({ msg: "Course exists" })
		}

		const courseInDb = await Course.findById(courseId)

		courseInDb.courseCode = req.body.courseCode
		courseInDb.section = req.body.section
		courseInDb.semester = req.body.semester

		const course = await courseInDb.save()
		res.json(course)
	} catch (err) {
		res.status(500).json(err.message)
	}
})

//Delete course
router.delete("/:courseId", authenticate, authorizeAdmin, async (req, res) => {
	try {
		const courseId = req.params.courseId
		const course = await Course.findByIdAndDelete(courseId)
		const students = await Student.find({
			"courses.course": courseId 
		})

		for (const student of students) {
			async(student) => {
			const result = await Student.updateOne(
				{ _id: student._id },
				{
					$pull: {
						courses: { course: courseId }
					}
				}
			)
		}
		}
		
		res.json(course)
	} catch (err) {
		res.status(500).json(err.message)
	}
})

module.exports = router
