from DocumentProcessor import DocumentProcessor
from IndexCreator import IndexCreator

DP = DocumentProcessor()
IC = IndexCreator()


splits = DP.process_documents("cw")
index_exists = IC.index_exists(IC.index_name)
if index_exists==False:
    IC.create_index()
else:
    IC.delete_all_documents()
    pass

IC.upload_documents(splits)