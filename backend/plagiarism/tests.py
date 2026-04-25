from django.test import TestCase, override_settings
import numpy as np


class TextExtractorTests(TestCase):
    def test_extract_text_missing_file(self):
        from plagiarism.extractor import extract_text
        result = extract_text('/nonexistent/file.pdf')
        self.assertEqual(result, '')

    def test_extract_text_none_path(self):
        from plagiarism.extractor import extract_text
        result = extract_text(None)
        self.assertEqual(result, '')

    def test_extract_text_empty_path(self):
        from plagiarism.extractor import extract_text
        result = extract_text('')
        self.assertEqual(result, '')


class SimilarityTests(TestCase):
    def test_similarity_empty_list(self):
        from plagiarism.similarity import compute_similarity_matrix
        result = compute_similarity_matrix([])
        self.assertEqual(result.shape, (0, 0))

    def test_similarity_single_document(self):
        from plagiarism.similarity import compute_similarity_matrix
        result = compute_similarity_matrix(['hello world'])
        self.assertEqual(result.shape, (1, 1))
        self.assertEqual(result[0][0], 0.0)

    def test_similarity_identical_texts(self):
        from plagiarism.similarity import compute_similarity_matrix
        texts = ['hello world', 'hello world']
        result = compute_similarity_matrix(texts)
        # Diagonal should be 1, off-diagonal computed
        self.assertEqual(result[0][1], 1.0)
        self.assertEqual(result[1][0], 1.0)

    def test_similarity_different_texts(self):
        from plagiarism.similarity import compute_similarity_matrix
        texts = ['hello world', 'completely different text here']
        result = compute_similarity_matrix(texts)
        # Should be less than 1 (not identical)
        self.assertLess(result[0][1], 1.0)

    def test_similarity_handles_empty_strings(self):
        from plagiarism.similarity import compute_similarity_matrix
        texts = ['', 'some content', '']
        result = compute_similarity_matrix(texts)
        self.assertEqual(result.shape, (3, 3))
        # Empty strings should have low similarity
        self.assertLess(result[0][1], 1.0)
