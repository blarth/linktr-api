import { fetchComments } from "../repositories/commentRepository.js";

export async function getComments(req, res){
	try{
		const {id} = req.params;
		const { rows: comments } = await fetchComments(id)
		res.status(200).send(comments);
	}catch(error){
		console.log(error);
		res.sendStatus(500);
	}
}