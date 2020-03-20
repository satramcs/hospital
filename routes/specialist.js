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
	my_conn.query("SELECT * FROM speciality", (err, rows) => {
		if(err){
			res.render('specialist/list', {data:''});
		}else{
			res.render('specialist/list', {data:rows});
		}
	});
});

router.get('/add', function(req, res, next) {
	res.render('specialist/add', {data:''});
});

router.post('/add', [upload.single('file')], function(req, res) {
	// const errors = validationResult(req);
	if(req.body.subject.trim()) {

		if(req.file){
			var ext = path.extname(req.file.originalname).toLowerCase();
			var file = appRoot+'/public/images/' + req.file.filename+ext;
			if(ext == '.jpg' || ext == '.png' || ext == '.jpeg'){

				fs.rename(req.file.path, file, function(err) {
					if (err) {
						res.send(500);
					} else {

						var specialist = {
							subject: req.body.subject,
							specialist_image: req.file.filename+ext
						}

						my_conn.query('INSERT INTO speciality SET ?', specialist, function(err, result) {
							if (err) {
								req.flash('error', 'Unable to add doctor!');
								res.render('specialist/add', {data:''});
							} else {
								req.flash('success', 'specialist added successfully!');
								res.redirect('/specialist/list');
							}
						});
					}
				});
			}else{
				req.flash('error', 'Invalid image extension!');
				res.redirect('/specialist/add');
			}
		}else{
			req.flash('error', 'Please upload image!');
			res.redirect('/specialist/add');
		}
	}else{
		req.flash('error', 'Please enter valid subject!');
		res.redirect('/specialist/add');
		// var errs = parse_validation_errors(errors.array());
		// req.flash('error', errs);
		// res.redirect('/specialist/add');
	}
});

router.get('/edit/(:id)', function(req, res, next){
	my_conn.query('SELECT * FROM speciality WHERE sp_id = ' + req.params.id, function(err, [row], fields) {
		if(err) throw err

			if (!row) {
				req.flash('error', 'Specialist not found with id = ' + req.params.id)
				res.redirect('/specialist/list')
			}else{
				res.render('specialist/edit', {
					data:row
				});
			}            
		});
});


router.post('/update/(:id)', [upload.single('file')], function(req, res) {
	var sp_id = req.params.id;
	if(req.body.subject.trim()) {
		if(req.file){
			var ext = path.extname(req.file.originalname).toLowerCase();
			var file = appRoot+'/public/images/' + req.file.filename+ext;
			if(ext == '.jpg' || ext == '.png' || ext == '.jpeg'){

				fs.rename(req.file.path, file, function(err) {
					if (err) {
						res.send(500);
					} else {
						fs.unlinkSync(appRoot+'/public/images/'+req.body.old_file);
						update_specialist(req.file.filename+ext);
					}
				});
			}else{
				req.flash('error', 'Invalid image extension!');
				res.redirect('/specialist/edit/'+sp_id);
			}
		}else{
			update_specialist();
		}
	}else{
		req.flash('error', 'Please enter valid subject!');
		res.redirect('/specialist/edit/'+sp_id);
	}

	function update_specialist(new_file=''){
		var specialist = {
			subject: req.body.subject
		}

		if(new_file){
			specialist.specialist_image = new_file;
		}

		my_conn.query('UPDATE speciality SET ? WHERE sp_id = ' + sp_id, specialist, function(err, result) {
			if (err) {
				req.flash('error', 'can not edit!');
				res.redirect('/specialist/edit/'+sp_id);
			} else {
				req.flash('success', 'specialist updated successfully!');
				res.redirect('/specialist/list');
			}
		});
	}
});

router.get('/delete/(:id)', function(req, res, next) {
	var specialist = { sp_id: req.params.id }
	var sp_id = req.params.id;

	my_conn.query('SELECT * FROM speciality WHERE sp_id = ' + sp_id, function(err, [row], fields) {
		if(err) throw err

			if (!row) {
				req.flash('error', 'Specialist not found')
				res.redirect('/specialist/list')
			}else{

				my_conn.query('SELECT count(*) as total FROM doctor_specialist WHERE specialist_id = ' + sp_id, function(err, [get_row], fields) {
					if(err) throw err

						if (get_row.total > 0) {
							req.flash('error', 'Specialist already map to doctor');
							res.redirect('/specialist/list');
						}else{
							fs.unlinkSync(appRoot+'/public/images/'+row.specialist_image);
							my_conn.query('DELETE FROM speciality WHERE sp_id = ' + sp_id, specialist, function(err, result) {
								if (err) {
									req.flash('error', err);
									res.redirect('/specialist/list');
								} else {
									req.flash('success', 'Specialist deleted successfully!');
									res.redirect('/specialist/list');
								}
							});
						}            
					});
			}            
		});

	
});

// function parse_validation_errors(errors){
// 	var error_msg = '';
// 	errors.forEach(function(error) {
// 		error_msg += error.msg + ' '+ error.param + '<br>'
// 	});
// 	return error_msg;
// }

module.exports = router;
