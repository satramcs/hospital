const express = require('express');
const router = express.Router();
const my_conn  = require('../db');
const multer = require("multer");
const fs = require("fs");
var path = require('path');
const { check, validationResult } = require('express-validator');

var upload = multer({ dest: '/images/'});

/* GET users listing. */
router.get('/list', function(req, res, next) {
	my_conn.query("SELECT doctor.*, subject FROM doctor JOIN doctor_specialist on doctor_specialist.doctor_id = doctor.id JOIN speciality on speciality.sp_id = doctor_specialist.specialist_id ", (err, rows) => {
		if(err){
			res.render('doctor/list', {data:''});
		}else{

			var simple_array = {};
			for(i=0; i<rows.length; i++){
				if(simple_array[rows[i].id]){
					simple_array[rows[i].id].subject += ', '+rows[i].subject;
				}else{
					simple_array[rows[i].id] = rows[i];
				}
			}

			for(n in simple_array){
				console.log(simple_array[n].subject);
			}

			res.render('doctor/list', {data:simple_array});
		}
	});
});

router.get('/add', function(req, res, next) {
	my_conn.query("SELECT sp_id, subject FROM speciality", (err, rows) => {
		if(err){
			res.render('doctor/list', {data:''});
		}else{
			if(rows.length == 0){
				req.flash('error', 'Please add atleast one specialist to map!');
				res.redirect('/specialist/add');
			}else{
				res.render('doctor/add', {data:rows});
			}
		}
	});
});

router.post('/add', [upload.single('file')], function(req, res) {
	if(req.body.name.trim() && req.body.course.trim() && req.body.specialists && req.body.specialists.length) {

		if(req.file){
			var ext = path.extname(req.file.originalname).toLowerCase();
			var file = appRoot+'/public/images/' + req.file.filename+ext;
			if(ext == '.jpg' || ext == '.png' || ext == '.jpeg'){

				fs.rename(req.file.path, file, function(err) {
					if (err) {
						res.send(500);
					} else {

						var doctor = {
							name: req.body.name,
							course: req.body.course,
							doctor_image: req.file.filename+ext
						}

						my_conn.query('INSERT INTO doctor SET ?', doctor, function(err, result) {
							if (err) {
								res.render('doctor/add', {data:''});
							} else {
								
								var last_id = result.insertId;

								map_specialist(last_id, req.body.specialists).then(get_res => {
									req.flash('success', 'doctor added successfully!');
									res.redirect('/doctor/list');
								});
							}
						});
					}
				});
			}else{
				req.flash('error', 'Invalid image extension!');
				res.redirect('/doctor/add');
			}
		}else{
			req.flash('error', 'Please upload image!');
			res.redirect('/doctor/add');
		}
	}else{
		req.flash('error', 'Please enter valid inputs!');
		res.redirect('/doctor/add');
	}
});

router.get('/edit/(:id)', function(req, res, next){
	my_conn.query('SELECT * FROM doctor WHERE id = ' + req.params.id, function(err, [row], fields) {
		if(err) throw err

			if (!row) {
				req.flash('error', 'doctor not found with id = ' + req.params.id)
				res.redirect('/doctor/list')
			}else{

				my_conn.query("SELECT sp_id, subject, doctor_id FROM speciality LEFT JOIN doctor_specialist on specialist_id=sp_id AND doctor_id = "+req.params.id, (err, rows) => {
					if(err){
						console.log(err);
						res.render('doctor/list', {data:''});
					}else{
						console.log(rows);
						res.render('doctor/edit', {
							data:row,
							specialists:rows
						});
					}
				});
			}            
		});
});

router.post('/update/(:id)', [upload.single('file')], function(req, res) {
	var id = req.params.id;
	if(req.body.name.trim() && req.body.course.trim() && req.body.specialists.length) {
		if(req.file){
			var ext = path.extname(req.file.originalname).toLowerCase();
			var file = appRoot+'/public/images/' + req.file.filename+ext;
			if(ext == '.jpg' || ext == '.png' || ext == '.jpeg'){

				fs.rename(req.file.path, file, function(err) {
					if (err) {
						res.send(500);
					} else {
						fs.unlinkSync(appRoot+'/public/images/'+req.body.old_file);
						update_doctor(req.file.filename+ext);
					}
				});
			}else{
				req.flash('error', 'Invalid image extension!');
				res.redirect('/doctor/edit/'+id);
			}
		}else{
			update_doctor();
		}
	}else{
		req.flash('error', 'Please enter valid inputs!');
		res.redirect('/doctor/edit/'+id);
	}

	function update_doctor(new_file=''){
		var doctor = {
			name: req.body.name,
			course: req.body.course,
		}

		if(new_file){
			doctor.doctor_image = new_file;
		}

		my_conn.query('UPDATE doctor SET ? WHERE id = ' + id, doctor, function(err, result) {
			if (err) {
				req.flash('error', 'can not edit!');
				res.redirect('/doctor/edit/'+id);
			} else {

				map_specialist(id, req.body.specialists).then(get_res => {
					req.flash('success', 'doctor updated successfully!');
					res.redirect('/doctor/list');
				});
			}
		});
	}
});

router.get('/delete/(:id)', function(req, res, next) {
	var doctor = { id: req.params.id }
	var id = req.params.id;

	my_conn.query('SELECT * FROM doctor WHERE id = ' + id, function(err, [row], fields) {
		if(err) throw err

			if (!row) {
				req.flash('error', 'doctor not found')
				res.redirect('/doctor/list')
			}else{
				console.log(row.doctor_image);
				fs.unlinkSync(appRoot+'/public/images/'+row.doctor_image);

				my_conn.query('DELETE FROM doctor_specialist WHERE doctor_id = ' + id, function(err, result) {
					if (err) {
						throw err;
					} else {
						my_conn.query('DELETE FROM doctor WHERE id = ' + id, doctor, function(err, result) {
							if (err) {
								req.flash('error', err);
								res.redirect('/doctor/list');
							} else {

								req.flash('success', 'doctor deleted successfully!');
								res.redirect('/doctor/list');

							}
						});
					}
				});

			}            
		});
});

function map_specialist(doc_id, specialists){
	return new Promise((resolve, reject) => {
		my_conn.query('DELETE FROM doctor_specialist WHERE doctor_id = ' + doc_id, function(err, result) {
			if (err) {
				throw err;
			} else {
				var values = [];
				for(elm of specialists){
					values.push([doc_id, elm]);
				}
				my_conn.query('INSERT INTO doctor_specialist (doctor_id, specialist_id) VALUES ?', [values], function(err, result) {
					if (err) {
						throw err;
						reject('err');
					} else {
						resolve(1);
					}
				});
			}
		});
	});
}

module.exports = router;