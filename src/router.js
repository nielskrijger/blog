import { Router } from 'express';
import getPosts from './requests/getPosts';
import getPost from './requests/getPost';
import getPage from './requests/getPage';

const router = Router();

router.get('/posts/:date/:slug', getPost);
router.get('/posts', getPosts);
router.get('/pages/:slug', getPage);
router.get('/', getPosts);

export default router;
